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
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { users: {}, codes: {} }; // codes: code -> userId
  }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function makeCode() {
  // 8-char nice code (A-Z0-9)
  return crypto.randomBytes(6).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

// Ensure user exists and has referral code
app.post("/ensure-user", (req, res) => {
  const { id, name } = req.body || {};
  if (!id) return res.status(400).json({ error: "Missing id" });

  const db = loadDB();
  db.users = db.users || {};
  db.codes = db.codes || {};

  if (!db.users[id]) {
    db.users[id] = { name: name || "User", balance: 0, referrals: 0, code: "" };
  } else if (name && !db.users[id].name) {
    db.users[id].name = name;
  }

  if (!db.users[id].code) {
    let code = makeCode();
    while (db.codes[code]) code = makeCode();
    db.codes[code] = String(id);
    db.users[id].code = code;
  }

  saveDB(db);
  res.json(db.users[id]);
});

// Get user by id
app.get("/user/:id", (req, res) => {
  const db = loadDB();
  res.json((db.users && db.users[req.params.id]) || {});
});

// Resolve referral code -> userId (used by bot or for debug)
app.get("/resolve/:code", (req, res) => {
  const db = loadDB();
  const uid = db.codes?.[String(req.params.code).toUpperCase()] || null;
  res.json({ userId: uid });
});

app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port:", PORT));
