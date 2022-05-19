/**
 * Symbol Art Editor
 *
 * @author malulleybovo (since 2021)
 * @license GNU General Public License v3.0
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2021  Arthur Malulley B. de O.
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 * This file contains modified code authored and made publicly
 * available by HybridEidolon (https://github.com/HybridEidolon)
 * at https://github.com/HybridEidolon/saredit
 */

const BlowfishCrypto = require('./BlowfishCrypto');
const PRSFileCompressor = require('./PRSFileCompressor');
const Cursor = require('./Cursor');
const SoundOption = require('./model/SoundOption');
const SymbolArtType = require('./model/SymbolArtType');
const SymbolArt = require('./model/SymbolArt');
const Symbol = require('./model/Symbol');

module.exports = class SARFileUtils {
  static _headerType = 'sar';
  static _compressedFlag = 0x84;
  static _uncompressedFlag = 0x04;
  static _encryptionKeyArrayBuffer = Uint8Array.of(0x09, 0x07, 0xc1, 0x2b)
    .buffer;
  static _blowfishEncryptionContext = new BlowfishCrypto({
    encryptionKeyArrayBuffer: SARFileUtils._encryptionKeyArrayBuffer
  });

  static _6BitColorToInGameColorMap = [
    0, 1, 3, 4, 5, 7, 8, 10, 12, 14, 18, 18, 20, 22, 24, 27, 29, 32, 35, 38, 41,
    44, 47, 50, 53, 56, 60, 63, 67, 71, 75, 79, 83, 87, 91, 95, 100, 104, 109,
    114, 118, 123, 128, 133, 138, 144, 149, 155, 160, 166, 171, 177, 183, 189,
    195, 202, 208, 214, 221, 227, 234, 241, 248, 255
  ];
  static inGameColorTo6BitColorMap = (() => {
    let map = [];
    for (var i = 0; i <= 255; i++) {
      let exactMatch = SARFileUtils._6BitColorToInGameColorMap.indexOf(i);
      if (
        Number.isSafeInteger(exactMatch) &&
        exactMatch >= 0 &&
        exactMatch < SARFileUtils._6BitColorToInGameColorMap.length
      ) {
        map.push(exactMatch);
        continue;
      }
      let lowerMatches = SARFileUtils._6BitColorToInGameColorMap.filter(
        a => a < i
      );
      let higherMatches = SARFileUtils._6BitColorToInGameColorMap.filter(
        a => a > i
      );
      let lowerMatch = lowerMatches[lowerMatches.length - 1];
      let higherMatch = higherMatches[0];
      if (!Number.isSafeInteger(lowerMatch)) lowerMatch = i;
      if (!Number.isSafeInteger(higherMatch)) higherMatch = Infinity;
      if (Math.abs(lowerMatch - i) < Math.abs(higherMatch - i)) {
        map.push(SARFileUtils._6BitColorToInGameColorMap.indexOf(lowerMatch));
      } else {
        map.push(SARFileUtils._6BitColorToInGameColorMap.indexOf(higherMatch));
      }
    }
    return map;
  })();

  static parseIntoSymbolArt({ fileDataArrayBuffer }) {
    try {
      let byteArray = new Uint8Array(fileDataArrayBuffer);
      let numberOfBytesInFile = fileDataArrayBuffer.byteLength;
      let numberOfBytesInHeaderSection = 4;
      let isFileFormattedCorretly =
        byteArray[0] === SARFileUtils._headerType.charCodeAt(0) &&
        byteArray[1] === SARFileUtils._headerType.charCodeAt(1) &&
        byteArray[2] === SARFileUtils._headerType.charCodeAt(2);
      let flag = byteArray[3];
      let isFlagValid =
        flag === SARFileUtils._compressedFlag ||
        flag === SARFileUtils._uncompressedFlag;
      if (!isFileFormattedCorretly) {
        return null;
      }
      if (!isFlagValid) {
        return null;
      }
      byteArray = byteArray.slice(
        numberOfBytesInHeaderSection,
        numberOfBytesInFile
      );
      SARFileUtils._blowfishEncryptionContext.decrypt({
        arrayBuffer: byteArray.buffer
      });
      let decryptedFileDataArrayBuffer = byteArray.buffer;
      if (flag === SARFileUtils._compressedFlag) {
        // Byte wise XOR by 0x95 of input from after flag bit
        // to the maximum multiple of 8 bytes on input
        byteArray = byteArray.map(function (currVal, idx, arr) {
          return arr[idx] ^ 0x95;
        });
        decryptedFileDataArrayBuffer = PRSFileCompressor.decompressFileData({
          fileDataArrayBuffer: byteArray.buffer
        });
      }
      let cursor = new Cursor(decryptedFileDataArrayBuffer);
      let fileContent = cursor.parse();
      let symbolArt = SARFileUtils._convertToSymbolArt({
        fileContent: fileContent
      });
      return symbolArt;
    } catch (e) {
      console.error(e);
    }
  }

  static _convertToSymbolArt({ fileContent }) {
    if (!fileContent) return null;
    let soundOption = new SoundOption({ index: fileContent.soundEffect });
    let symbolArtType = null;
    switch (fileContent.sizeWidth) {
      case SymbolArtType.symbolArt.width:
        symbolArtType = SymbolArtType.symbolArt;
        break;
      case SymbolArtType.allianceFlag.width:
        symbolArtType = SymbolArtType.allianceFlag;
        break;
    }
    let symbolArt = new SymbolArt({
      type: symbolArtType,
      soundOption: soundOption,
      authorId: fileContent.authorId
    });
    symbolArt.root.name = fileContent.name;
    for (var i = fileContent.layers.length - 1; i >= 0; i--) {
      let layer = fileContent.layers[i];
      let vertices = layer.points;
      let properties = layer.props;
      let symbol = new Symbol();
      let topLeftOrigin = new Origin({
        x: Math.round(
          SymbolArt.scaling *
            0.25 *
            (vertices.topLeft.x +
              vertices.topRight.x +
              vertices.bottomRight.x +
              vertices.bottomLeft.x)
        ),
        y: Math.round(
          SymbolArt.scaling *
            0.25 *
            (vertices.topLeft.y +
              vertices.topRight.y +
              vertices.bottomRight.y +
              vertices.bottomLeft.y)
        )
      });
      let centerOrigin = new Origin({
        x:
          topLeftOrigin.x -
          2 * Math.round(0.25 * SymbolArt.usableDimensions.width),
        y:
          -topLeftOrigin.y +
          2 * Math.round(0.25 * SymbolArt.usableDimensions.height)
      });
      symbol.frame.origin = centerOrigin;
      symbol.frame.vertexA.set({
        x: SymbolArt.scaling * vertices.topLeft.x - topLeftOrigin.x,
        y: -(SymbolArt.scaling * vertices.topLeft.y - topLeftOrigin.y)
      });
      symbol.frame.vertexB.set({
        x: SymbolArt.scaling * vertices.topRight.x - topLeftOrigin.x,
        y: -(SymbolArt.scaling * vertices.topRight.y - topLeftOrigin.y)
      });
      symbol.color.r =
        SARFileUtils._6BitColorToInGameColorMap[Math.round(properties.colorR)];
      symbol.color.g =
        SARFileUtils._6BitColorToInGameColorMap[Math.round(properties.colorG)];
      symbol.color.b =
        SARFileUtils._6BitColorToInGameColorMap[Math.round(properties.colorB)];
      symbol.asset.index = properties.textureIndex;
      symbol.opacity.index = properties.transparency;
      symbol.isHidden = !properties.visible;
      if (UIApplication.shared.supports({ asset: symbol.asset })) {
        symbolArt.root.add({ sublayer: symbol });
      }
    }
    return symbolArt;
  }

  static exportAsBlob({ symbolArt }) {
    let packedData = SARFileUtils._convertFromSymbolArt({
      symbolArt: symbolArt
    });
    let fileDataBufferArray = SARFileUtils._convertToFileDataBufferArray({
      packedData: packedData
    });
    if (fileDataBufferArray === null) return null;
    SARFileUtils._blowfishEncryptionContext.encrypt({
      arrayBuffer: fileDataBufferArray.buffer
    });
    let identifier = new Uint8Array(4);
    identifier[0] = SARFileUtils._headerType.charCodeAt(0);
    identifier[1] = SARFileUtils._headerType.charCodeAt(1);
    identifier[2] = SARFileUtils._headerType.charCodeAt(2);
    identifier[3] = SARFileUtils._uncompressedFlag;
    var blob = new Blob([identifier, fileDataBufferArray]);
    return blob;
  }

  static _convertFromSymbolArt({ symbolArt }) {
    if (!(symbolArt instanceof SymbolArt)) return null;
    let symbols = symbolArt.root.symbols;
    let fileContent = {
      authorId: symbolArt.authorId & 0xffffffff,
      layerCount: symbols.length & 0xff,
      layers: symbols
        .map(symbol => {
          let topLeftOrigin = new Origin({
            x: symbol.frame.origin.x + 0.5 * SymbolArt.usableDimensions.width,
            y: -symbol.frame.origin.y + 0.5 * SymbolArt.usableDimensions.height
          });
          return {
            points: {
              bottomLeft: {
                x: Math.round(
                  (symbol.frame.vertexD.x + topLeftOrigin.x) / SymbolArt.scaling
                ),
                y: Math.round(
                  (-symbol.frame.vertexD.y + topLeftOrigin.y) /
                    SymbolArt.scaling
                )
              },
              bottomRight: {
                x: Math.round(
                  (symbol.frame.vertexC.x + topLeftOrigin.x) / SymbolArt.scaling
                ),
                y: Math.round(
                  (-symbol.frame.vertexC.y + topLeftOrigin.y) /
                    SymbolArt.scaling
                )
              },
              topLeft: {
                x: Math.round(
                  (symbol.frame.vertexA.x + topLeftOrigin.x) / SymbolArt.scaling
                ),
                y: Math.round(
                  (-symbol.frame.vertexA.y + topLeftOrigin.y) /
                    SymbolArt.scaling
                )
              },
              topRight: {
                x: Math.round(
                  (symbol.frame.vertexB.x + topLeftOrigin.x) / SymbolArt.scaling
                ),
                y: Math.round(
                  (-symbol.frame.vertexB.y + topLeftOrigin.y) /
                    SymbolArt.scaling
                )
              }
            },
            props: {
              colorR: SARFileUtils.inGameColorTo6BitColorMap[symbol.color.r],
              colorG: SARFileUtils.inGameColorTo6BitColorMap[symbol.color.g],
              colorB: SARFileUtils.inGameColorTo6BitColorMap[symbol.color.b],
              colorX: 0,
              colorY: 0,
              colorZ: 0,
              textureIndex: symbol.asset.index,
              transparency: symbol.opacity.index,
              visible: !symbol.isHidden
            }
          };
        })
        .slice(0, 0xff)
        .reverse(),
      name: symbolArt.root.name.substr(0, 20),
      sizeHeight: symbolArt.type.height,
      sizeWidth: symbolArt.type.width,
      soundEffect: symbolArt.soundOption.index & 0xff
    };
    return fileContent;
  }

  static _convertToFileDataBufferArray({ packedData }) {
    try {
      if (
        packedData === undefined ||
        !Number.isSafeInteger(packedData.authorId) ||
        !Number.isSafeInteger(packedData.layerCount) ||
        !Number.isSafeInteger(packedData.sizeHeight) ||
        !Number.isSafeInteger(packedData.sizeWidth) ||
        !Number.isSafeInteger(packedData.soundEffect) ||
        !Array.isArray(packedData.layers) ||
        typeof packedData.name !== 'string' ||
        packedData.layers.length !== packedData.layerCount
      ) {
        return null;
      }
      let uint8arr = new Uint8Array(
        8 + 16 * packedData.layerCount + 2 * packedData.name.length // In Bytes
      );
      let pos = 0;
      uint8arr[pos++] = packedData.authorId & 0xff;
      uint8arr[pos++] = (packedData.authorId >> 8) & 0xff;
      uint8arr[pos++] = (packedData.authorId >> 16) & 0xff;
      uint8arr[pos++] = (packedData.authorId >> 24) & 0xff;
      uint8arr[pos++] = packedData.layerCount & 0xff;
      uint8arr[pos++] = packedData.sizeHeight & 0xff;
      uint8arr[pos++] = packedData.sizeWidth & 0xff;
      uint8arr[pos++] = packedData.soundEffect & 0xff;
      for (var i = 0; i < packedData.layers.length; i++) {
        let layer = packedData.layers[i];
        let vertices = layer.points;
        let properties = layer.props;
        uint8arr[pos++] = vertices.topLeft.x & 0xff;
        uint8arr[pos++] = vertices.topLeft.y & 0xff;
        uint8arr[pos++] = vertices.bottomLeft.x & 0xff;
        uint8arr[pos++] = vertices.bottomLeft.y & 0xff;
        uint8arr[pos++] = vertices.topRight.x & 0xff;
        uint8arr[pos++] = vertices.topRight.y & 0xff;
        uint8arr[pos++] = vertices.bottomRight.x & 0xff;
        uint8arr[pos++] = vertices.bottomRight.y & 0xff;
        // Write condensed 32 bit layer properties
        uint8arr[pos++] = ((properties.colorG & 0x3) << 6) | properties.colorR;
        uint8arr[pos++] =
          ((properties.colorB & 0xf) << 4) | ((properties.colorG >> 2) & 0xf);
        uint8arr[pos++] =
          ((properties.textureIndex & 0x7) << 5) |
          (properties.transparency << 2) |
          ((properties.colorB >> 4) & 0x3);
        uint8arr[pos++] =
          ((properties.visible ? 0 : 1) << 7) |
          ((properties.textureIndex >> 3) & 0x7f);
        // Write condensed 32 bit color X, Y, Z
        uint8arr[pos++] = ((properties.colorY & 0x3) << 6) | properties.colorX;
        uint8arr[pos++] =
          ((properties.colorZ & 0xf) << 4) | ((properties.colorY >> 2) & 0xf);
        uint8arr[pos++] = (properties.colorZ >> 4) & 0x3;
        uint8arr[pos++] = 0;
      }
      // Write Symbol Art name using UTF-16
      for (var i = 0; i < packedData.name.length; i++) {
        let charCode = packedData.name.charCodeAt(i);
        // Write lowerByte
        uint8arr[pos++] = charCode & 0xff;
        // Write upperByte
        uint8arr[pos++] = (charCode >> 8) & 0xff;
      }
      return uint8arr;
    } catch (error) {
      return null;
    }
  }
};
