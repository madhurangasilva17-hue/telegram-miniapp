const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "users.json");

function loadDB() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    db.users = db.users || {};
    db.codes = db.codes || {}; // code -> userId
    return db;
  } catch {
    return { users: {}, codes: {} };
  }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function makeCode() {
  // 8-char A-Z0-9
  return crypto
    .randomBytes(6)
    .toString("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

// Create/ensure user + code
app.post("/ensure-user", (req, res) => {
  const { id, name } = req.body || {};
  if (!id) return res.status(400).json({ error: "Missing id" });

  const db = loadDB();
  const uid = String(id);

  if (!db.users[uid]) {
    db.users[uid] = { id: uid, name: name || "User", balance: 0, referrals: 0, code: "" };
  } else if (name) {
    db.users[uid].name = name;
  }

  if (!db.users[uid].code) {
    let code = makeCode();
    while (db.codes[code]) code = makeCode();
    db.codes[code] = uid;
    db.users[uid].code = code;
  }

  saveDB(db);
  res.json(db.users[uid]);
});

// Read user
app.get("/user/:id", (req, res) => {
  const db = loadDB();
  res.json(db.users[String(req.params.id)] || {});
});

// Health
app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port:", PORT));
