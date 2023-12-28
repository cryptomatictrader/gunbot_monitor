const diskinfo = require("diskinfo");
const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const os = require("os");
const hostname = os.hostname();

module.exports = class DiskMonitor {
    constructor() {
        diskinfo.getDrives(function (err, aDrives) {
            for (var i = 0; i < aDrives.length; i++) {
                const disk = aDrives[i];
                console.log(`Monitoring mount point ${disk.mounted} disk util >${config.DISK_THRESHOLD}`);
            }
        });
    }
    run() {
        const _this = this;
        setInterval(() => {
            diskinfo.getDrives(function (err, aDrives) {
                for (var i = 0; i < aDrives.length; i++) {
                    const disk = aDrives[i];
                    if (disk.used / disk.blocks >= config.DISK_THRESHOLD) {
                        const msg = `[${hostname}] Disk utilization threshold reached. mount ${disk.mounted} capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                        console.log(msg);
                        telegramClient.sendMessage(msg);
                    } else {
                        const msg = `[${hostname}] mount ${disk.mounted} capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                        console.log(msg);
                    }
                }
            });
        }, config.DISK_MONITOR_INTERVAL * 1000);
    }
};
