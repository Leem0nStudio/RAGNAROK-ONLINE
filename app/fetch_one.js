const https = require("https");
const fs = require("fs");
https.get("https://raw.githubusercontent.com/Leemonztuff/gameassets/main/Characters/F/1/swordman_.png", (res) => {
  let chunks = [];
  res.on("data", chunk => chunks.push(chunk));
  res.on("end", () => {
    let buf = Buffer.concat(chunks);
    fs.writeFileSync("swordman_.png", buf);
    console.log("Downloaded, size: ", buf.length);
  });
});
