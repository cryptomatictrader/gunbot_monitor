const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const Latenz = require("latenz");
const os = require("os");
const hostname = os.hostname();

module.exports = class IpMonitor {
    constructor() {}
    run() {
        const latencyCheckHostName = config.LATENCY_CHECK_HOSTNAME;
        const latencyCheckThreshold = config.LATENCY_THRESHOLD;
        console.log(`Monitoring network latency (${latencyCheckHostName}) >${latencyCheckThreshold}ms`);
        setInterval(() => {
            new Latenz()
                .measure(latencyCheckHostName)
                .then((result) => {
                    const latency = result[2].time;
                    if (latency >= latencyCheckThreshold) {
                        const msg = `[${hostname}] ${latencyCheckHostName} network latency is ${latency}ms (>${latencyCheckThreshold}ms)`;
                        console.log(msg);
                        telegramClient.sendMessage(msg);
                    } else {
                        const msg = `[${hostname}] ${latencyCheckHostName} network latency is ${latency}ms (<${latencyCheckThreshold}ms)`;
                        console.log(msg);
                    }
                })
                .catch((err) => {
                    console.error("Error checking network latency", err);
                });
        }, config.NETWORK_MONITOR_INTERVAL * 1000);
    }
};
