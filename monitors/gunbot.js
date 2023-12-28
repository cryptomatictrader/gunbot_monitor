const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const execSync = require("child_process").execSync;
const os = require("os");
const hostname = os.hostname();

module.exports = class GunbotMonitor {
    constructor() {
        this.instanceNames = config.GB_INSTANCES_TO_MONITOR;
        this.instancePath = config.GB_INSTANCES_DIR;
        console.log(`Monitoring instance activities for ${this.instanceNames} at ${this.instancePath}`);
    }

    #getMostRecentFile = (dir) => {
        const files = this.#orderReccentFiles(dir);
        return files.length ? files[0] : undefined;
    };

    #orderReccentFiles = (dir) => {
        return fs
            .readdirSync(dir)
            .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
            .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    };

    run() {
        const _this = this;
        setInterval(() => {
            for (let instName of this.instanceNames) {
                const latestFileInfo = this.#getMostRecentFile(path.join(this.instancePath, instName, "json"));
                const currentTime = moment();
                const latestFileTime = moment(latestFileInfo.mtime);
                var secondsDiff = currentTime.diff(latestFileTime, "seconds");
                if (secondsDiff >= config.GB_IDLE_THRESHOLD) {
                    const msg = `[${hostname}](${instName}) is idling for ${secondsDiff} seconds. Running 'pm2 restart ${instName}' now.`;
                    console.log(msg);
                    telegramClient.sendMessage(msg);
                    const cmd = `pm2 restart ${instName}`;
                    console.log(execSync(cmd, { encoding: "utf8" }));
                } else {
                    console.log(`[${hostname}] *${instName}* is running`);
                }
            }
        }, config.GB_MONITOR_INTERVAL * 1000);
    }
};
