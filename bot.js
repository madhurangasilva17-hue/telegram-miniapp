const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const token = "YOUR_BOT_TOKEN"; // BotFather token
const bot = new TelegramBot(token, { polling: true });

const DB_FILE = path.join(__dirname, "users.json");

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    return { users: {} };
  }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

bot.onText(/\/start\s?(.*)?/, (msg, match) => {
  const db = loadDB();
  const userId = String(msg.from.id);
  const referrerId = (match && match[1]) ? String(match[1]).trim() : "";

  // create user if new
  if (!db.users[userId]) {
    db.users[userId] = {
      name: msg.from.first_name || "User",
      balance: 0,
      referrals: 0
    };

    // referral bonus
    if (referrerId && referrerId !== userId && db.users[referrerId]) {
      db.users[referrerId].balance += 200;
      db.users[referrerId].referrals += 1;
    }

    saveDB(db);
  }

  // ⚠️ TEMP (local test) — later we change to your HTTPS URL
  const WEBAPP_URL = "https://telegram-miniapp-p6qa.onrender.com";


  bot.sendMessage(msg.chat.id, "Open Dashboard 👇", {
    reply_markup: {
      inline_keyboard: [[
        { text: "Open App", web_app: { url: WEBAPP_URL } }
      ]]
    }
  });
});

console.log("✅ Bot running...");
