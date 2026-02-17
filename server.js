const express = require("express");
const https = require("https");
const path = require("path");
const app = express();

app.use(express.json());

const LOGIN_CODE = process.env.LOGIN_CODE || "1122";
const TEXTMEBOT_KEY = process.env.TEXTMEBOT_KEY || "tsczjwP7zTnN";

app.post("/api/login", (req, res) => {
  const { code } = req.body;
  res.json({ ok: code === LOGIN_CODE });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/send", (req, res) => {
  const { recipient, text } = req.query;
  if (!recipient || !text) return res.json({ ok: false, msg: "Parameter fehlen" });

  const params = new URLSearchParams({ recipient, apikey: TEXTMEBOT_KEY, text });
  https.get("https://api.textmebot.com/send.php?" + params, (r) => {
    let body = "";
    r.on("data", (c) => (body += c));
    r.on("end", () => {
      console.log("→", recipient, ":", body.trim());
      res.json({ ok: true, msg: body.trim() });
    });
  }).on("error", (e) => res.json({ ok: false, msg: e.message }));
});

app.listen(process.env.PORT || 3000, () => console.log("Server läuft!"));
