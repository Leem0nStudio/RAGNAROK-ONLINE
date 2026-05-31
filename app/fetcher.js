const https = require("https");
const getFiles = (path) => {
  https.get("https://api.github.com/repos/Leemonztuff/gameassets/contents/" + path, {headers: {"User-Agent": "node.js"}}, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      let json = JSON.parse(data);
      if(Array.isArray(json)) {
        json.forEach(d => {
          if (d.type === "dir") getFiles(d.path);
          if (d.type === "file" && d.name.endsWith(".png")) console.log(d.path);
        });
      }
    });
  });
};
getFiles("Characters");
