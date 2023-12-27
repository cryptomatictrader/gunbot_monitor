const TelegramBot = require("node-telegram-bot-api");
const config = require("config");
const MAX_MESSAGE_SIZE = 4096;

class TelegramClient {
    constructor() {
        this.bot = new TelegramBot(config.get("TG_BOT_TOKEN")); // polling false by default
    }
    sendMessage(msg) {
        this.bot.sendMessage(config.get("TG_CHAT_ID"), msg.substring(0, MAX_MESSAGE_SIZE));
    }
}

module.exports = new TelegramClient();
