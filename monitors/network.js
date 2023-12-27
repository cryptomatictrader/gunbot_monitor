const config = require("config");
const telegramClient = require("../helpers/telegram_client");
const Latenz = require("latenz");
const os = require("os");

module.exports = class IpMonitor {
    constructor() {
        this.hostname = os.hostname();
    }
    run() {
        console.log(`Monitoring network latency (${config.get("LATENCY_CHECK_HOSTNAME")}) >${config.get("LATENCY_THRESHOLD")}ms`);
        const _this = this;
        setInterval(() => {
            new Latenz()
                .measure(config.get("LATENCY_CHECK_HOSTNAME"))
                .then((result) => {
                    const latency = result[2].time;
                    if (latency >= config.get("LATENCY_THRESHOLD")) {
                        const msg = `[${_this.hostname}] ${config.get(
                            "LATENCY_CHECK_HOSTNAME"
                        )} network latency is ${latency}ms (>${config.get("LATENCY_THRESHOLD")}ms)`;
                        console.log(msg);
                        telegramClient.sendMessage(msg);
                    } else {
                        const msg = `[${_this.hostname}] ${config.get(
                            "LATENCY_CHECK_HOSTNAME"
                        )} network latency is ${latency}ms (<${config.get("LATENCY_THRESHOLD")}ms)`;
                        console.log(msg);
                    }
                })
                .catch((err) => {
                    console.error("Error checking network latency", err);
                });
        }, config.get("NETWORK_MONITOR_INTERVAL") * 1000);
    }
};
