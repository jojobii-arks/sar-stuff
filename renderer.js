const fs = require('fs/promises');

let parsed;
fs.readFile('./output/io-blush-data.json', { encoding: 'utf8' })
  .then(JSON.parse)
  .catch(console.error);

const { createCanvas, loadImage } = require('canvas');
const canvas = createCanvas(200, 200);
const ctx = canvas.getContext('2d');

// Write "Awesome!"
ctx.font = '30px Impact';
ctx.rotate(0.1);
ctx.fillText('Awesome!', 50, 100);

// Draw line under text
var text = ctx.measureText('Awesome!');
ctx.strokeStyle = 'rgba(0,0,0,0.5)';
ctx.beginPath();
ctx.lineTo(50, 102);
ctx.lineTo(50 + text.width, 102);
ctx.stroke();

const out = canvas.createPNGStream();

fs.writeFile(__dirname + '/test.png', out);
