const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = "TOKEN_HERE"; // put your @testmysrilanka_bot token here (do NOT share)
const WEBAPP_URL = "https://telegram-miniapp-p6qa.onrender.com/?v=999";
const REF_BONUS = 200;

const bot = new TelegramBot(TOKEN, { polling: true });

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

bot.onText(/\/start\s?(.*)?/, (msg, match) => {
  const db = loadDB();

  const userId = String(msg.from.id);
  const code = (match && match[1]) ? String(match[1]).trim().toUpperCase() : "";

  // ensure user exists
  if (!db.users[userId]) {
    db.users[userId] = { id: userId, name: msg.from.first_name || "User", balance: 0, referrals: 0, code: "" };
  } else if (msg.from.first_name) {
    db.users[userId].name = msg.from.first_name;
  }

  // referral: only first time per new user
  if (code && !db.users[userId].joinedVia) {
    const referrerId = db.codes[code]; // created by /ensure-user in server.js
    if (referrerId && referrerId !== userId) {
      db.users[userId].joinedVia = code;

      db.users[referrerId] = db.users[referrerId] || { id: referrerId, name: "User", balance: 0, referrals: 0, code: "" };
      db.users[referrerId].balance = (db.users[referrerId].balance || 0) + REF_BONUS;
      db.users[referrerId].referrals = (db.users[referrerId].referrals || 0) + 1;
    }
  }

  saveDB(db);

  bot.sendMessage(msg.chat.id, "Open Dashboard 👇", {
    reply_markup: {
      inline_keyboard: [[{ text: "Open App", web_app: { url: WEBAPP_URL } }]]
    }
  });
});

console.log("✅ Bot running...");
