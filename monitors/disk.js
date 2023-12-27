const diskinfo = require("diskinfo");
const config = require("config");
const telegramClient = require("../helpers/telegram_client");

module.exports = class DiskMonitor {
    constructor() {
        diskinfo.getDrives(function (err, aDrives) {
            for (var i = 0; i < aDrives.length; i++) {
                const disk = aDrives[i];
                console.log(`Monitoring mount point ${disk.mounted} disk util >${config.get("DISK_THRESHOLD")}`);
            }
        });
    }
    run() {
        setInterval(() => {
            diskinfo.getDrives(function (err, aDrives) {
                for (var i = 0; i < aDrives.length; i++) {
                    const disk = aDrives[i];
                    if (disk.used / disk.blocks >= config.get("DISK_THRESHOLD")) {
                        const msg = `Disk util threshold reached. mount ${disk.mounted} capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                        console.log(msg);
                        telegramClient.sendMessage(msg);
                    } else {
                        const msg = `mount ${disk.mounted} capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                        console.log(msg);
                    }
                }
            });
        }, config.get("DISK_MONITOR_INTERVAL") * 1000);
    }
};
