const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = "TOKEN_HERE"; // ✅ put your @testmysrilanka_bot token here (DO NOT SHARE)
const WEBAPP_URL = "https://telegram-miniapp-p6qa.onrender.com/?v=20000"; // ✅ cache bust

const REFERRER_BONUS = 200; // link owner gets 200
const NEW_USER_BONUS = 100; // new user gets 100

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
function makeCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 chars
}

bot.onText(/\/start\s?(.*)?/, (msg, match) => {
  const db = loadDB();

  const userId = String(msg.from.id);
  const userName = msg.from.first_name || "User";
  const startParam = (match && match[1]) ? String(match[1]).trim() : "";
  const refCode = startParam.toUpperCase();

  // ✅ Ensure user exists
  if (!db.users[userId]) {
    // create user
    let myCode = makeCode();
    while (db.codes[myCode]) myCode = makeCode();

    db.users[userId] = {
      id: userId,
      name: userName,
      balance: 0,
      referrals: 0,
      code: myCode,
      joinedVia: null
    };
    db.codes[myCode] = userId;
  } else {
    db.users[userId].name = userName;
  }

  // ✅ Referral rewards only ONCE per user (joinedVia null)
  if (refCode && !db.users[userId].joinedVia) {
    const referrerId = db.codes[refCode];

    // valid referral: code exists & not self
    if (referrerId && referrerId !== userId) {
      // mark joined
      db.users[userId].joinedVia = refCode;

      // ensure referrer exists
      if (!db.users[referrerId]) {
        db.users[referrerId] = {
          id: referrerId,
          name: "User",
          balance: 0,
          referrals: 0,
          code: "",
          joinedVia: null
        };
      }

      // 🎁 bonuses
      db.users[userId].balance += NEW_USER_BONUS;
      db.users[referrerId].balance += REFERRER_BONUS;
      db.users[referrerId].referrals += 1;
    }
  }

  saveDB(db);

  // ✅ Send launch message + Open App button
  const u = db.users[userId];

  bot.sendMessage(
    msg.chat.id,
`👋 Hello ${u.name}!

✅ Your account is ready.
💰 Balance: ${u.balance} LKR
👥 Referrals: ${u.referrals}

👇 Click below to open the app:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Open App", web_app: { url: WEBAPP_URL } }],
          [{ text: "📩 Share Referral Link", url: `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/testmysrilanka_bot?start=${u.code}`)}&text=${encodeURIComponent("Join using my referral link!")}` }]
        ]
      }
    }
  );
});

console.log("✅ Bot running...");
