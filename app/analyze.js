const fs = require("fs");
const PNG = require("pngjs").PNG;
let data = fs.readFileSync("acolyte.png");
let png = PNG.sync.read(data);
let minX = png.width, minY = png.height, maxX = 0, maxY = 0;
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    let idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log({minX, minY, maxX, maxY});
