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
        console.log(`Monitoring network latency to ${latencyCheckHostName} >${latencyCheckThreshold}ms`);
        setInterval(() => {
            try {
                new Latenz()
                    .measure(latencyCheckHostName)
                    .then((result) => {
                        const latency = result[2].time;
                        _this.latencyHistory.enqueue(latency);
                        if (!_this.latencyHistory.isFull()) return;
                        if (_this.latencyHistory.getAverage() >= latencyCheckThreshold) {
                            const msg = `** Average network latency threshold reached in ${hostname} **\nExchange host: *${latencyCheckHostName}*\nAverage: *${_this.latencyHistory.getAverage()}ms* (>${latencyCheckThreshold}ms)\nCurrent: *${latency}ms*`;
                            console.log(msg);
                            telegramClient.sendMessage(msg);
                        } else {
                            const msg = `Average network latency from ${hostname} to ${latencyCheckHostName} ${_this.latencyHistory.getAverage()}ms (<${latencyCheckThreshold}ms), current ${latency}ms`;
                            console.log(msg);
                        }
                    })
                    .catch((err) => {
                        console.error(`Error checking network latency ${hostname}`, err);
                    });
            } catch (e) {
                console.error(`Error checking network latency ${hostname}`, e);
            }
        }, config.NETWORK_MONITOR_INTERVAL * 1000);
    }
};
