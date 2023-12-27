const config = require("config");
const telegramClient = require("../helpers/telegram_client");
const TailFile = require("@logdna/tail-file");
const path = require("path");
const FastRateLimit = require("fast-ratelimit").FastRateLimit;

module.exports = class ErrorMonitor {
    constructor() {
        this.instanceNames = config.get("GB_INSTANCES_TO_MONITOR");
        this.notificationLimiter = new FastRateLimit({
            threshold: config.get("ERR_NOTIFICATION_THRESHOLD"),
            ttl: config.get("ERR_NOTIFICATION_TTL"),
        });
    }
    run() {
        const _this = this;
        for (let instName of this.instanceNames) {
            const fileName = path.join(process.env.HOME, ".pm2", "logs", `${instName}-out.log`);
            console.log(`Monitoring error at ${fileName}`);
            new TailFile(fileName, { encoding: "utf8" })
                .on("data", (chunk) => {
                    if (chunk.indexOf("error") != -1 || chunk.indexOf("Error") != -1) {
                        // Check if it is allowed to send message
                        if (_this.notificationLimiter.consumeSync(`inst_${instName}`) === true) {
                            const msg = `Error in '${instName}' - ${chunk}`;
                            console.log(msg);
                            telegramClient.sendMessage(msg);
                        }
                    }
                })
                .on("tail_error", (err) => {
                    console.error(`Error reading ${fileName}`, err);
                })
                .on("error", (err) => {
                    console.error(`Error reading ${fileName}`, err);
                })
                .start()
                .catch((err) => {
                    console.error(`Error reading ${fileName}`, err);
                });
        }
    }
};
