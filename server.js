const express = require("express");
const https = require("https");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const app = express();

app.use(express.json());

const LOGIN_CODE = process.env.LOGIN_CODE || "1122";
const TEXTMEBOT_KEY = process.env.TEXTMEBOT_KEY || "tsczjwP7zTnN";

// Bild-Upload Ordner
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Statische Dateien aus uploads servieren
app.use("/uploads", express.static(uploadDir));

app.post("/api/login", (req, res) => {
  const { code } = req.body;
  res.json({ ok: code === LOGIN_CODE });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Bild hochladen
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.json({ ok: false, msg: "Kein Bild" });
  // URL zum Bild auf diesem Server
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  const imageUrl = protocol + "://" + host + "/uploads/" + req.file.filename;
  res.json({ ok: true, url: imageUrl, filename: req.file.filename });
});

// Nachricht senden (mit optionalem Bild)
app.get("/api/send", (req, res) => {
  const { recipient, text, file } = req.query;
  if (!recipient || !text) return res.json({ ok: false, msg: "Parameter fehlen" });

  const params = new URLSearchParams({ recipient, apikey: TEXTMEBOT_KEY, text });
  if (file) params.append("file", file);

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

      // Bild nach Senden löschen (aufräumen)
      if (file && file.includes("/uploads/")) {
        const filename = file.split("/uploads/").pop();
        const filepath = path.join(uploadDir, filename);
        setTimeout(() => {
          fs.unlink(filepath, () => {});
        }, 10000);
      }
    });
  });

  request.on("error", (e) => {
    res.json({ ok: false, msg: "Verbindung zu TextMeBot fehlgeschlagen: " + e.message });
  });

  request.setTimeout(15000, () => {
    request.destroy();
    res.json({ ok: true, msg: "Timeout - Nachricht wahrscheinlich gesendet" });
  });
});

app.listen(process.env.PORT || 3000, () => console.log("Server läuft!"));
