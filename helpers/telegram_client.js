const TelegramBot = require("node-telegram-bot-api");
const config = require("config");

class TelegramClient {
    constructor() {
        this.bot = new TelegramBot(config.get("TG_BOT_TOKEN")); // polling false by default
    }
    sendMessage(msg) {
        this.bot.sendMessage(config.get("TG_CHAT_ID"), msg);
    }
}

module.exports = new TelegramClient();
