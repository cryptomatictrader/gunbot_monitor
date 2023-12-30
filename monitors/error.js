const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const TailFile = require("@logdna/tail-file");
const path = require("path");
const FastRateLimit = require("fast-ratelimit").FastRateLimit;
const os = require("os");
const hostname = os.hostname();
const numOfCharsBefore = 256;
const numOfCharsAfter = 1024;

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
                console.log(`Monitoring error events in ${outFileName}`);
                new TailFile(outFileName, { encoding: "utf8" })
                    .on("data", (chunk) => {
                        const sErrorIndex = chunk.indexOf("error");
                        const lErrorIndex = chunk.indexOf("Error");
                        if (sErrorIndex != -1 || lErrorIndex != -1) {
                            let startIndex = Math.min(
                                ...[sErrorIndex, lErrorIndex].filter((num) => {
                                    return num >= 0;
                                })
                            );
                            startIndex = startIndex - numOfCharsBefore >= 0 ? startIndex - numOfCharsBefore : 0;
                            const errMsg = chunk.substring(startIndex, startIndex + numOfCharsAfter); // Just get the first 1024 chars after the first 'error' or 'Error'
                            // Check if it is allowed to send message using rate limiter
                            if (_this.notificationLimiter.consumeSync(`inst_${instName}`) === true) {
                                const msg = `Error detected in ${hostname}:${instName}\n${errMsg}`;
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
