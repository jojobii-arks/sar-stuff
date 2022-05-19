// const cornersObj = data.layers[0].points;
// const corners = [
//   {
//     x: 57,
//     y: 147
//   },
//   {
//     x: 65,
//     y: 147
//   },
//   {
//     x: 65,
//     y: 155
//   },
//   {
//     x: 57,
//     y: 155
//   }
// ];

// canvas = document.querySelector('canvas');
// step = 1;
// console.log(canvas);

// var img = new Image();
// img.onload = () => {
//   render(img);
// };
// img.src = '../res/assets/754.png';

// function render(img) {
//   const canvas = document.createElement('canvas');
//   const ctx = canvas.getContext('2d');

//   var p1,
//     p2,
//     p3,
//     p4,
//     y1c,
//     y2c,
//     y1n,
//     y2n,
//     w = img.width - 1, // -1 to give room for the "next" points
//     h = img.height - 1;

//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   for (y = 0; y < h; y += step) {
//     for (x = 0; x < w; x += step) {
//       y1c = lerp(corners[0], corners[3], y / h);
//       y2c = lerp(corners[1], corners[2], y / h);
//       y1n = lerp(corners[0], corners[3], (y + step) / h);
//       y2n = lerp(corners[1], corners[2], (y + step) / h);

//       // corners of the new sub-divided cell p1 (ul) -> p2 (ur) -> p3 (br) -> p4 (bl)
//       p1 = lerp(y1c, y2c, x / w);
//       p2 = lerp(y1c, y2c, (x + step) / w);
//       p3 = lerp(y1n, y2n, (x + step) / w);
//       p4 = lerp(y1n, y2n, x / w);

//       ctx.drawImage(
//         img,
//         x,
//         y,
//         step,
//         step,
//         p1.x,
//         p1.y, // get most coverage for w/h:
//         Math.ceil(
//           Math.max(step, Math.abs(p2.x - p1.x), Math.abs(p4.x - p3.x))
//         ) + 1,
//         Math.ceil(
//           Math.max(step, Math.abs(p1.y - p4.y), Math.abs(p2.y - p3.y))
//         ) + 1
//       );
//     }
//   }

//   return canvas;
// }

// function lerp(p1, p2, t) {
//   return {
//     x: p1.x + (p2.x - p1.x) * t,
//     y: p1.y + (p2.y - p1.y) * t
//   };
// }
