const https = require("https");
const fs = require("fs");

function d(url, name) {
  https.get(url, (res) => {
    let chunks = [];
    res.on("data", chunk => chunks.push(chunk));
    res.on("end", () => {
      let buf = Buffer.concat(chunks);
      fs.writeFileSync(name, buf);
      console.log(name, "size: ", buf.length);
    });
  });
}

d("https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/2-1/priest_.png", "priest.png");
d("https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/novice_f.png", "novice.png");
d("https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/acolyte_.png", "acolyte.png");
