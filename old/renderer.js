const fs = require('fs/promises');

let parsed;
fs.readFile('./output/io-blush-data.json', { encoding: 'utf8' })
  .then(JSON.parse)
  .catch(console.error);
