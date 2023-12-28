const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const TailFile = require("@logdna/tail-file");
const path = require("path");
const FastRateLimit = require("fast-ratelimit").FastRateLimit;
const os = require("os");
const hostname = os.hostname();

module.exports = class ErrorMonitor {
    constructor() {
        this.instanceNames = config.GB_INSTANCES_TO_MONITOR;
        this.notificationLimiter = new FastRateLimit({
            threshold: config.ERR_NOTIFICATION_THRESHOLD,
            ttl: config.ERR_NOTIFICATION_TTL,
        });
    }
    run() {
        const _this = this;
        for (let instName of this.instanceNames) {
            for (let suffix of ["out", "error"]) {
                const outFileName = path.join(process.env.HOME, ".pm2", "logs", `${instName}-${suffix}.log`);
                console.log(`Monitoring error events at ${outFileName}`);
                new TailFile(outFileName, { encoding: "utf8" })
                    .on("data", (chunk) => {
                        const sErrorIndex = chunk.indexOf("error");
                        const lErrorIndex = chunk.indexOf("Error");
                        if (sErrorIndex != -1 || lErrorIndex != -1) {
                            const startIndex = Math.min(
                                ...[sErrorIndex, lErrorIndex].filter((num) => {
                                    return num > 0;
                                })
                            );
                            const errMsg = chunk.substring(startIndex, startIndex + 1024); // Just get the first 512 chars after the first 'error' or 'Error'
                            // Check if it is allowed to send message using rate limiter
                            if (_this.notificationLimiter.consumeSync(`inst_${instName}`) === true) {
                                const msg = `[${hostname}] *${instName}* ${errMsg}`;
                                console.log(msg);
                                telegramClient.sendMessage(msg);
                            }
                        }
                    })
                    .on("tail_error", (err) => {
                        console.error(`Error reading ${outFileName}`, err);
                    })
                    .on("error", (err) => {
                        console.error(`Error reading ${outFileName}`, err);
                    })
                    .start()
                    .catch((err) => {
                        console.error(`Error reading ${outFileName}`, err);
                    });
            }
        }
    }
};
