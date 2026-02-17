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
    db.withdrawals = db.withdrawals || []; // list
    return db;
  } catch {
    return { users: {}, codes: {}, withdrawals: [] };
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

function todayKey() {
  // Daily counter key (server timezone)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ✅ Ensure user exists + generate referral code
app.post("/ensure-user", (req, res) => {
  const { id, name } = req.body || {};
  if (!id) return res.status(400).json({ error: "Missing id" });

  const db = loadDB();
  const uid = String(id);

  if (!db.users[uid]) {
    db.users[uid] = {
      name: name || "User",
      balance: 0,
      referrals: 0,
      code: "",
      daily: {} // { "YYYY-MM-DD": { done: number } }
    };
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

// ✅ Get user
app.get("/user/:id", (req, res) => {
  const db = loadDB();
  res.json(db.users[String(req.params.id)] || {});
});

// ✅ Daily task: complete one ad (max 30 per day)
app.post("/task/complete-ad", (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "Missing id" });

  const db = loadDB();
  const uid = String(id);
  const user = db.users[uid];
  if (!user) return res.status(404).json({ error: "User not found" });

  const key = todayKey();
  user.daily = user.daily || {};
  user.daily[key] = user.daily[key] || { done: 0 };

  const LIMIT = 30;
  if (user.daily[key].done >= LIMIT) {
    return res.json({ ok: false, message: "Daily limit reached", done: user.daily[key].done, limit: LIMIT, balance: user.balance });
  }

  // earning per ad (change here)
  const EARN_PER_AD = 10;

  user.daily[key].done += 1;
  user.balance = (user.balance || 0) + EARN_PER_AD;

  saveDB(db);
  res.json({ ok: true, done: user.daily[key].done, limit: LIMIT, balance: user.balance });
});

// ✅ Withdraw request
app.post("/withdraw/request", (req, res) => {
  const { id, amount, method, account } = req.body || {};
  if (!id || !amount || !method || !account) return res.status(400).json({ error: "Missing fields" });

  const db = loadDB();
  const uid = String(id);
  const user = db.users[uid];
  if (!user) return res.status(404).json({ error: "User not found" });

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

  // minimum withdraw (change here)
  const MIN = 500;
  if (amt < MIN) return res.status(400).json({ error: `Minimum withdraw is ${MIN}` });

  if ((user.balance || 0) < amt) return res.status(400).json({ error: "Insufficient balance" });

  // hold funds (deduct now)
  user.balance -= amt;

  db.withdrawals.push({
    id: uid,
    name: user.name,
    amount: amt,
    method,
    account,
    status: "PENDING",
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.json({ ok: true, balance: user.balance });
});

app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port:", PORT));
