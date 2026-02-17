bot.onText(/\/start\s?(.*)?/, (msg, match) => {
  const db = loadDB();
  db.users = db.users || {};
  db.codes = db.codes || {};

  const userId = String(msg.from.id);
  const param = (match && match[1]) ? String(match[1]).trim() : ""; // could be CODE

  // ensure user exists
  if (!db.users[userId]) {
    db.users[userId] = { name: msg.from.first_name || "User", balance: 0, referrals: 0, code: "" };
  }

  // if param is a code, resolve to referrerId
  const code = param.toUpperCase();
  const referrerId = db.codes[code]; // code -> userId

  // add referral bonus only if new user AND valid referrer
  // (if you want ONLY first time bonus)
  if (param && referrerId && referrerId !== userId && !db.users[userId].joinedVia) {
    db.users[userId].joinedVia = code;

    db.users[referrerId].balance = (db.users[referrerId].balance || 0) + 200;
    db.users[referrerId].referrals = (db.users[referrerId].referrals || 0) + 1;
  }

  saveDB(db);

  const WEBAPP_URL = "https://telegram-miniapp-p6qa.onrender.com";
  bot.sendMessage(msg.chat.id, "Open Dashboard 👇", {
    reply_markup: {
      inline_keyboard: [[{ text: "Open App", web_app: { url: WEBAPP_URL } }]]
    }
  });
});
