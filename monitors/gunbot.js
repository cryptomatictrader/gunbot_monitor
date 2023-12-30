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
        console.log(`Monitoring instance activities for ${this.instanceNames} in ${this.instancePath}`);
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
        setInterval(() => {
            for (let instName of this.instanceNames) {
                const latestFileInfo = this.#getMostRecentFile(path.join(this.instancePath, instName, "json"));
                const currentTime = moment();
                const latestFileTime = moment(latestFileInfo.mtime);
                var secondsDiff = currentTime.diff(latestFileTime, "seconds");
                if (secondsDiff >= config.GB_IDLE_THRESHOLD) {
                    // Zipping up log and json files
                    const zipFileName = `${moment().format("MMMDD-HH-mm-ss")}-logs.zip`;
                    try {
                        execSync(`mkdir -p ${path.join("..", "reports")}`, { encoding: "utf8" });
                        const outFileName = path.join(process.env.HOME, ".pm2", "logs", `${instName}-out.log`);
                        const errFileName = path.join(process.env.HOME, ".pm2", "logs", `${instName}-error.log`);
                        const jsonFolder = path.join(path.join(this.instancePath, instName, "json"));
                        console.log(
                            execSync(`zip -q -r ${path.join("..", "reports", zipFileName)} ${outFileName} ${errFileName} ${jsonFolder}`, {
                                encoding: "utf8",
                            })
                        );
                    } catch (e) {
                        console.err(e);
                    }
                    // Informing the user
                    const msg = `Idle process detected in ${hostname}:${instName}\nDuration: ${secondsDiff}s\n${zipFileName} created in 'reports' directory\nRunning 'pm2 restart ${instName}' now`;
                    console.log(msg);
                    telegramClient.sendMessage(msg);
                    const cmd = `pm2 restart ${instName}`;
                    console.log(execSync(cmd, { encoding: "utf8" }));
                } else {
                    console.log(`${instName} in ${hostname} is running`);
                }
            }
        }, config.GB_MONITOR_INTERVAL * 1000);
    }
};
