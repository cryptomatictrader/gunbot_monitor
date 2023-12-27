const diskinfo = require("diskinfo");
const config = require("config");
const telegramClient = require("../helpers/telegram_client");
const os = require("os");

module.exports = class DiskMonitor {
    constructor() {
        this.hostname = os.hostname();
        diskinfo.getDrives(function (err, aDrives) {
            for (var i = 0; i < aDrives.length; i++) {
                const disk = aDrives[i];
                console.log(`Monitoring mount point ${disk.mounted} disk util >${config.get("DISK_THRESHOLD")}`);
            }
        });
    }
    run() {
        const _this = this;
        setInterval(() => {
            diskinfo.getDrives(function (err, aDrives) {
                for (var i = 0; i < aDrives.length; i++) {
                    const disk = aDrives[i];
                    if (disk.used / disk.blocks >= config.get("DISK_THRESHOLD")) {
                        const msg = `[${_this.hostname}] Disk utilization threshold reached. mount ${disk.mounted} capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                        console.log(msg);
                        telegramClient.sendMessage(msg);
                    } else {
                        const msg = `[${_this.hostname}] mount ${disk.mounted} capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                        console.log(msg);
                    }
                }
            });
        }, config.get("DISK_MONITOR_INTERVAL") * 1000);
    }
};
