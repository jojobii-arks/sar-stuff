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
    fsp.writeFile('./output.json', JSON.stringify(symbolArt, null, 2));
  })
  .catch(console.error);
