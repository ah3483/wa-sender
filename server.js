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
  const url = "https://api.textmebot.com/send.php?" + params;

  const request = https.get(url, (r) => {
    let body = "";
    r.on("data", (c) => (body += c));
    r.on("end", () => {
      const trimmed = body.trim();
      console.log("TextMeBot [" + r.statusCode + "]:", trimmed);
      const low = trimmed.toLowerCase();
      const isError = low.includes("error") || low.includes("invalid") ||
                      low.includes("not connected") || low.includes("wrong key");
      res.json({ ok: !isError, msg: trimmed || "OK (leer)" });
    });
  });

  request.on("error", (e) => {
    console.log("TextMeBot Fehler:", e.message);
    res.json({ ok: false, msg: "Verbindung zu TextMeBot fehlgeschlagen: " + e.message });
  });

  request.setTimeout(15000, () => {
    request.destroy();
    res.json({ ok: true, msg: "Timeout - Nachricht wahrscheinlich gesendet" });
  });
});

app.listen(process.env.PORT || 3000, () => console.log("Server läuft!"));
