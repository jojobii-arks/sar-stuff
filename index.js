const fs = require('fs/promises');

fs.readFile('./sar-examples/IoBlush.sar')
  .then(processSarBuffer)
  .catch(err => console.error(err));

function processSarBuffer(buffer) {
  let u8view = new Uint8Array(buffer);
  const flag = u8view[3];

  if (u8view[0] !== 115 || u8view[1] !== 97 || u8view[2] !== 114) {
    console.error('not a SAR file');
    process.exit(1);
  }

  if (flag !== 0x84 && flag !== 0x04) {
    console.error(`invalid flag ${flag}`);
  }

  u8view = u8view.slice(4, buffer.byteLength);
  let keyBuffer = Uint8Array.of(0x09, 0x07, 0xc1, 0x2b).buffer;

  console.log(keyBuffer);
}