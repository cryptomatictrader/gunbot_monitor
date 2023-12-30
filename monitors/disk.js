const diskinfo = require("diskinfo");
const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const os = require("os");
const hostname = os.hostname();

module.exports = class DiskMonitor {
    constructor() {
        diskinfo.getDrives(function (err, aDrives) {
            if (err) {
                console.error("Error retrieving disk mount information", err);
            } else {
                for (var i = 0; i < aDrives.length; i++) {
                    const disk = aDrives[i];
                    console.log(`Monitoring mount point ${disk.mounted} disk util >${config.DISK_THRESHOLD}`);
                }
            }
        });
    }
    run() {
        setInterval(() => {
            try {
                diskinfo.getDrives(function (err, aDrives) {
                    if (err) {
                        console.error("Error retrieving disk mount information", err);
                    } else {
                        for (var i = 0; i < aDrives.length; i++) {
                            const disk = aDrives[i];
                            if (disk.used / disk.blocks >= config.DISK_THRESHOLD) {
                                const msg = `Disk utilization threshold reached in ${hostname}\nMount: ${disk.mounted}\nCapacity: ${disk.capacity}\nAvailable: ${disk.available}\nUsed: ${disk.used}\nBlocks: ${disk.blocks}`;
                                console.log(msg);
                                telegramClient.sendMessage(msg);
                            } else {
                                const msg = `Disk utilization in ${hostname} mount ${disk.mounted}, capacity ${disk.capacity}, available ${disk.available}, used ${disk.used}, blocks ${disk.blocks}`;
                                console.log(msg);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error(e);
            }
        }, config.DISK_MONITOR_INTERVAL * 1000);
    }
};
