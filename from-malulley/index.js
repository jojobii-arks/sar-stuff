const SARFileUtils = require('./utils/SARFileUtils');
const fsp = require('fs/promises');

let symbolArt;

fsp
  .readFile('./io-blush.sar')
  .then(v => {
    symbolArt = SARFileUtils.parseIntoSymbolArt({
      fileDataArrayBuffer: v
    });
  })
  .then(() => {
    console.log(symbolArt.layers);
  })
  .catch(console.error);
