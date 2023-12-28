const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const IntegerQueue = require("../models/integer_queue");
const Latenz = require("latenz");
const os = require("os");
const hostname = os.hostname();

module.exports = class IpMonitor {
    constructor() {
        this.latencyHistory = new IntegerQueue(config.LATENCY_CHECK_DATA_PTS);
    }
    run() {
        const _this = this;
        const latencyCheckHostName = config.LATENCY_CHECK_HOSTNAME;
        const latencyCheckThreshold = config.LATENCY_THRESHOLD;
        console.log(`Monitoring network latency (${latencyCheckHostName}) >${latencyCheckThreshold}ms`);
        setInterval(() => {
            new Latenz()
                .measure(latencyCheckHostName)
                .then((result) => {
                    const latency = result[2].time;
                    _this.latencyHistory.enqueue(latency);
                    console.log(`[${hostname}] ${latencyCheckHostName} current network latency is ${latency}ms`);
                    if (!_this.latencyHistory.isFull()) return;
                    if (_this.latencyHistory.getAverage() >= latencyCheckThreshold) {
                        const msg = `[${hostname}] ${latencyCheckHostName} average network latency is ${_this.latencyHistory.getAverage()}ms (>${latencyCheckThreshold}ms)`;
                        console.log(msg);
                        telegramClient.sendMessage(msg);
                    } else {
                        const msg = `[${hostname}] ${latencyCheckHostName} average network latency is ${_this.latencyHistory.getAverage()}ms (<${latencyCheckThreshold}ms)`;
                        console.log(msg);
                    }
                })
                .catch((err) => {
                    console.error("Error checking network latency", err);
                });
        }, config.NETWORK_MONITOR_INTERVAL * 1000);
    }
};
