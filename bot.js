const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "PASTE_YOUR_TOKEN_HERE";  // ← botfather token
const bot = new TelegramBot(token, { polling: true });

const DB_FILE = "./users.json";

/* load DB */
function loadDB(){
  if(!fs.existsSync(DB_FILE)){
    fs.writeFileSync(DB_FILE, JSON.stringify({users:{}},null,2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

/* save DB */
function saveDB(db){
  fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2));
}

/* create referral code */
function makeCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

/* START COMMAND */
bot.onText(/\/start\s?(.*)?/, (msg, match) => {

  const userId = String(msg.from.id);
  const refCode = match[1];

  const db = loadDB();

  /* create user if not exists */
  if(!db.users[userId]){

    db.users[userId] = {
      id:userId,
      name:msg.from.first_name,
      balance:0,
      referrals:0,
      code:makeCode()
    };

    /* referral logic */
    if(refCode){

      const inviter = Object.values(db.users)
        .find(u => u.code === refCode);

      if(inviter && inviter.id !== userId){
        inviter.balance += 200;
        inviter.referrals += 1;
      }
    }
  }

  saveDB(db);

  /* open mini app */
  bot.sendMessage(userId,"Welcome!",{
    reply_markup:{
      inline_keyboard:[
        [{ text:"Open App", web_app:{ url:"https://telegram-miniapp-p6qa.onrender.com/?v=10" }}]
      ]
    }
  });

});

console.log("✅ Bot running...");
