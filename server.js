const https= require("https");
const http = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const port = 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync("./localhost-key.pem"),
  cert: fs.readFileSync("./localhost.pem")
};

app.prepare().then(() => {
  https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log("ready - started server on url: https://localhost:" + port);
  });
  http.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port+1, (err) => {
    if (err) throw err;
    console.log("ready - started server on url: http://localhost:" + (port+1));
  });
});
