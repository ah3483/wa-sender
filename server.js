const express = require("express");
const https = require("https");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// Proxy für TextMeBot API
app.get("/api/send", (req, res) => {
  const { recipient, apikey, text } = req.query;
  
  if (!recipient || !apikey || !text) {
    return res.json({ ok: false, msg: "Parameter fehlen" });
  }

  const params = new URLSearchParams({ recipient, apikey, text });
  const url = "https://api.textmebot.com/send.php?" + params;

  https.get(url, (r) => {
    let body = "";
    r.on("data", (c) => (body += c));
    r.on("end", () => {
      console.log("TextMeBot:", body.trim());
      res.json({ ok: true, msg: body.trim() });
    });
  }).on("error", (e) => {
    res.json({ ok: false, msg: e.message });
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft!");
});
