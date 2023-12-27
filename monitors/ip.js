const getIP = require("external-ip");
const config = require("config");
const telegramClient = require("../helpers/telegram_client");

module.exports = class IpMonitor {
    constructor() {
        getIP()((err, ip) => {
            if (err) {
                console.error(`Error getting external IP`, err);
                throw err;
            }
            this.prevIp = ip;
            console.log(`Monitoring IP change. Current IP is ${this.prevIp}`);
        });
    }
    run() {
        setInterval(() => {
            getIP()((err, ip) => {
                if (err) {
                    console.error(`Error getting external IP`, err);
                }
                if (ip != this.prevIp) {
                    this.prevIp = ip;
                    const msg = `New IP in use: ${ip}`;
                    console.log(msg);
                    telegramClient.sendMessage(msg);
                } else {
                    console.log(`No IP change (${this.prevIp})`);
                }
            });
        }, config.get("IP_MONITOR_INTERVAL") * 1000);
    }
};
