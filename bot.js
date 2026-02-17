bot.onText(/\/start\s?(.*)?/, (msg, match) => {
  const db = loadDB();
  db.users = db.users || {};
  db.codes = db.codes || {};

  const userId = String(msg.from.id);
  const param = (match && match[1]) ? String(match[1]).trim() : "";
  const code = param ? param.toUpperCase() : "";

  // ensure user exists
  if (!db.users[userId]) {
    db.users[userId] = { name: msg.from.first_name || "User", balance: 0, referrals: 0, code: "", daily: {} };
  } else if (msg.from.first_name) {
    db.users[userId].name = msg.from.first_name;
  }

  // referral: only first time
  const referrerId = db.codes[code];
  if (code && referrerId && referrerId !== userId && !db.users[userId].joinedVia) {
    db.users[userId].joinedVia = code;

    // bonus per referral (change here)
    const REF_BONUS = 200;

    db.users[referrerId].balance = (db.users[referrerId].balance || 0) + REF_BONUS;
    db.users[referrerId].referrals = (db.users[referrerId].referrals || 0) + 1;
  }

  saveDB(db);

  const WEBAPP_URL = "https://telegram-miniapp-p6qa.onrender.com/?v=3";


  bot.sendMessage(msg.chat.id, "Open Dashboard 👇", {
    reply_markup: {
      inline_keyboard: [[{ text: "Open App", web_app: { url: WEBAPP_URL } }]]
    }
  });
});
