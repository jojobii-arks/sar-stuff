module.exports = class Cursor {
  static _baseRegistry = {
    u8: cursor => cursor.readUint8(),
    u16: cursor => cursor.readUint16(false),
    u32: cursor => cursor.readUint32(false),
    u16le: cursor => cursor.readUint16(true),
    u32le: cursor => cursor.readUint32(true),
    i8: cursor => cursor.readInt8(),
    i16: cursor => cursor.readInt16(false),
    i32: cursor => cursor.readInt32(false),
    i16le: cursor => cursor.readInt16(true),
    i32le: cursor => cursor.readInt32(true),
    f32: cursor => cursor.readFloat32(false),
    f64: cursor => cursor.readFloat64(false),
    f32le: cursor => cursor.readFloat32(true),
    f64le: cursor => cursor.readFloat64(true)
  };

  static _pointSchema = {
    x: 'u8',
    y: 'u8'
  };

  static _layerSchema = {
    points: {
      topLeft: Cursor._pointSchema,
      bottomLeft: Cursor._pointSchema,
      topRight: Cursor._pointSchema,
      bottomRight: Cursor._pointSchema
    },
    props: (cursor, registry) => {
      let val1 = Cursor.parseAttribute({
        cursor: cursor,
        schema: 'u32le',
        registry: registry
      });
      let val2 = Cursor.parseAttribute({
        cursor: cursor,
        schema: 'u32le',
        registry: registry
      });

      let visible = (val1 >> 31) & (1 > 0) ? false : true;
      let textureIndex = (val1 >> 21) & 1023;
      let transparency = (val1 >> 18) & 7;
      let colorR = (val1 >> 0) & 63;
      let colorG = (val1 >> 6) & 63;
      let colorB = (val1 >> 12) & 63;

      let colorX = (val2 >> 0) & 63;
      let colorY = (val2 >> 6) & 63;
      let colorZ = (val2 >> 12) & 63;

      return {
        visible,
        textureIndex,
        transparency,
        colorR,
        colorG,
        colorB,
        colorX,
        colorY,
        colorZ
      };
    }
  };

  static _schema = (cursor, registry) => {
    let authorId = Cursor.parseAttribute({
      cursor: cursor,
      schema: 'u32le',
      registry: registry
    });
    let layerCount = Cursor.parseAttribute({
      cursor: cursor,
      schema: 'u8',
      registry: registry
    });
    let sizeHeight = Cursor.parseAttribute({
      cursor: cursor,
      schema: 'u8',
      registry: registry
    });
    let sizeWidth = Cursor.parseAttribute({
      cursor: cursor,
      schema: 'u8',
      registry: registry
    });
    let soundEffect = Cursor.parseAttribute({
      cursor: cursor,
      schema: 'u8',
      registry: registry
    });
    let layers = [];

    for (let i = 0; i < layerCount; i++) {
      layers.push(
        Cursor.parseAttribute({
          cursor: cursor,
          schema: Cursor._layerSchema,
          registry: registry
        })
      );
    }

    let name = [];
    // Read rest of buffer into Symbol Art name
    let startPos = cursor.pos;
    for (let i = 0; i < (cursor.dataView.byteLength - startPos) / 2; i++) {
      try {
        let c = Cursor.parseAttribute({
          cursor: cursor,
          schema: 'u16le',
          registry: registry
        });
        name.push(c);
      } catch (e) {
        break;
      }
    }

    let decoder = new TextDecoder('utf-16');
    let dataView = new DataView(Uint16Array.from(name).buffer);
    name = decoder.decode(dataView);

    return {
      authorId,
      layerCount,
      sizeHeight,
      sizeWidth,
      soundEffect,
      layers,
      name
    };
  };

  /**
   * Goes through a schema object and fill its data in order based on cursor and registry
   */
  static parseAttribute({ cursor, schema, registry }) {
    switch (typeof schema) {
      case 'string': {
        // For positions, name, and other properties
        // References a schema/parser in the registry
        return Cursor.parseAttribute({
          cursor: cursor,
          schema: registry[schema],
          registry: registry
        });
      }
      case 'function': {
        // For color
        // Cursor parse function
        return schema(cursor, registry);
      }
      case 'object': {
        // For the object itself and position 2D vectors
        // Schema object. Parse every attribute.
        let parsedObject = {};
        for (let k of Object.keys(schema)) {
          let v = schema[k];
          let value = Cursor.parseAttribute({
            cursor: cursor,
            schema: v,
            registry: registry
          });
          parsedObject[k] = value;
        }
        return parsedObject;
      }
    }
  }

  constructor(buffer) {
    this.buffer = buffer || new ArrayBuffer(64);
    this.dataView = new DataView(this.buffer);
    this.pos = 0;
    this.bitCounter = 0;
    this.bitValue = 0;
  }

  parse() {
    let registry = [Cursor._baseRegistry]
      .concat([])
      .reduce((a, v) => Object.assign(a, v), {});
    return Cursor.parseAttribute({
      cursor: this,
      schema: Cursor._schema,
      registry: registry
    });
  }

  _extendIfNeeded(adding) {
    if (this.pos + adding > this.buffer.byteLength) {
      let newBuffer = new ArrayBuffer(this.buffer.byteLength * 2);
      let newBufferDataView = new DataView(newBuffer);
      for (let i = 0; i < this.buffer.byteLength; i++) {
        newBufferDataView.setUint8(i, this.dataView.getUint8(i));
      }
      this.buffer = newBuffer;
      this.dataView = newBufferDataView;
    }
  }

  readBit() {
    if (this.bitCounter === 0) {
      this.bitValue = this.dataView.getUint8(this.pos);
      this.seek(1);
      this.bitCounter = 8;
    }

    let bit = this.bitValue & 1;
    this.bitCounter -= 1;
    this.bitValue = this.bitValue >>> 1;
    return bit;
  }

  readUint8() {
    let ret = this.dataView.getUint8(this.pos);
    this.seek(1);
    return ret;
  }

  readUint16(le) {
    let ret = this.dataView.getUint16(this.pos, le === true ? true : false);
    this.seek(2);
    return ret;
  }

  readUint32(le) {
    let ret = this.dataView.getUint32(this.pos, le === true ? true : false);
    this.seek(4);
    return ret;
  }

  readInt8() {
    let ret = this.dataView.getInt8(this.pos);
    this.seek(1);
    return ret;
  }

  readInt16(le) {
    let ret = this.dataView.getInt16(this.pos, le === true ? true : false);
    this.seek(2);
    return ret;
  }

  readInt32(le) {
    let ret = this.dataView.getInt32(this.pos, le === true ? true : false);
    this.seek(4);
    return ret;
  }

  readFloat32(le) {
    let ret = this.dataView.getFloat32(this.pos, le === true ? true : false);
    this.seek(4);
    return ret;
  }

  readFloat64(le) {
    let ret = this.dataView.getFloat64(this.pos, le === true ? true : false);
    this.seek(8);
    return ret;
  }

  writeUint8(v) {
    this._extendIfNeeded(1);
    this.dataView.setUint8(this.pos, v);
    this.seek(1);
  }

  writeUint16(v, le) {
    this._extendIfNeeded(2);
    this.dataView.setUint16(this.pos, v, le === true ? true : false);
    this.seek(2);
  }

  writeUint32(v, le) {
    this._extendIfNeeded(4);
    this.dataView.setUint32(this.pos, v, le === true ? true : false);
    this.seek(4);
  }

  writeInt8(v) {
    this._extendIfNeeded(1);
    this.dataView.setInt8(this.pos, v);
    this.seek(1);
  }

  writeInt16(v, le) {
    this._extendIfNeeded(2);
    this.dataView.setInt16(this.pos, v, le === true ? true : false);
    this.seek(2);
  }

  writeInt32(v, le) {
    this._extendIfNeeded(4);
    this.dataView.setInt32(this.pos, v, le === true ? true : false);
    this.seek(4);
  }

  writeFloat32(v, le) {
    this._extendIfNeeded(4);
    this.dataView.setFloat32(this.pos, v, le === true ? true : false);
    this.seek(4);
  }

  writeFloat64(v, le) {
    this._extendIfNeeded(8);
    this.dataView.setFloat64(this.pos, v, le === true ? true : false);
    this.seek(8);
  }

  seek(offset) {
    if (this.pos + offset > this.buffer.byteLength || this.pos + offset < 0) {
      throw new Error(
        `invalid seek to ${
          this.pos + offset
        } (by ${offset}) on buffer of length ${this.buffer.byteLength}`
      );
    }
    this.pos += offset;
  }
};
