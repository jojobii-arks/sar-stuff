const example = data.layers.reverse();

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

for (let i = 0; i < example.length; i++) {
  const e = example[i];
  const corners = [
    {
      x: e.points.topLeft.x,
      y: e.points.topLeft.y
    },
    {
      x: e.points.topRight.x,
      y: e.points.topRight.y
    },
    {
      x: e.points.bottomRight.x,
      y: e.points.bottomRight.y
    },
    {
      x: e.points.bottomLeft.x,
      y: e.points.bottomLeft.y
    }
  ];
  const img = new Image();
  img.src = `../res/assets/${e.props.textureIndex}.png`;
  img.onload = () => {
    const tempCanvas = render(img, corners);
    tempCtx = tempCanvas.getContext('2d');

    console.log(
      `rgb(${e.props.colorR * 4}, ${e.props.colorG * 4}, ${e.props.colorB * 4})`
    );
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = `rgb(${e.props.colorR * 4}, ${e.props.colorG * 4}, ${
      e.props.colorB * 4
    })`;
    tempCtx.globalAlpha = e.props.transparency / 7;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.width);
    ctx.drawImage(tempCanvas, 0, 0);
  };
}

function render(img, corners) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  const step = 1;

  var p1,
    p2,
    p3,
    p4,
    y1c,
    y2c,
    y1n,
    y2n,
    w = img.width - 1, // -1 to give room for the "next" points
    h = img.height - 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (y = 0; y < h; y += step) {
    for (x = 0; x < w; x += step) {
      y1c = lerp(corners[0], corners[3], y / h);
      y2c = lerp(corners[1], corners[2], y / h);
      y1n = lerp(corners[0], corners[3], (y + step) / h);
      y2n = lerp(corners[1], corners[2], (y + step) / h);

      // corners of the new sub-divided cell p1 (ul) -> p2 (ur) -> p3 (br) -> p4 (bl)
      p1 = lerp(y1c, y2c, x / w);
      p2 = lerp(y1c, y2c, (x + step) / w);
      p3 = lerp(y1n, y2n, (x + step) / w);
      p4 = lerp(y1n, y2n, x / w);

      ctx.drawImage(
        img,
        x,
        y,
        step,
        step,
        p1.x,
        p1.y, // get most coverage for w/h:
        Math.ceil(
          Math.max(step, Math.abs(p2.x - p1.x), Math.abs(p4.x - p3.x))
        ) + 1,
        Math.ceil(
          Math.max(step, Math.abs(p1.y - p4.y), Math.abs(p2.y - p3.y))
        ) + 1
      );
    }
  }

  return canvas;
}

function lerp(p1, p2, t) {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  };
}
