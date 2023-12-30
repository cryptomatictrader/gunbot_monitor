const getIP = require("external-ip");
const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const os = require("os");
const hostname = os.hostname();

module.exports = class IpMonitor {
    constructor() {
        try {
            getIP()((err, ip) => {
                if (err) {
                    console.error(`Error getting external IP`, err);
                } else {
                    this.prevIp = ip;
                    console.log(`Monitoring IP change. Current IP ${this.prevIp}`);
                }
            });
        } catch (e) {
            console.err("Error getting external IP", e);
        }
    }
    run() {
        setInterval(() => {
            try {
                getIP()((err, ip) => {
                    if (err) {
                        console.error(`Error getting external IP`, err);
                    } else {
                        if (ip != this.prevIp) {
                            const msg = `New IP detected in ${hostname}\nOld IP: ${this.prevIp}\nNew IP: ${ip}`;
                            console.log(msg);
                            telegramClient.sendMessage(msg);
                            this.prevIp = ip;
                        } else {
                            console.log(`No IP change in ${hostname}. Current IP ${this.prevIp}`);
                        }
                    }
                });
            } catch (e) {
                console.err("Error getting external IP", e);
            }
        }, config.IP_MONITOR_INTERVAL * 1000);
    }
};
