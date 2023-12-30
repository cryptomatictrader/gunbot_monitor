const SystemHealthMonitor = require("system-health-monitor");
const config = require("../config");
const telegramClient = require("../helpers/telegram_client");
const os = require("os");
const hostname = os.hostname();

module.exports = class SystemMonitor {
    constructor() {
        const memoryThreshold = config.MEMORY_THRESHOLD;
        const cpuThreshold = config.CPU_THRESHOLD;
        const monitorConfig = {
            checkIntervalMsec: config.SYSTEM_RESOURCES_CHECK_INTERVAL * 1000,
            mem: {
                thresholdType: "rate",
                highWatermark: memoryThreshold,
            },
            cpu: {
                thresholdType: "rate",
                highWatermark: cpuThreshold,
                calculationAlgo: "sma",
                periodPoints: config.SYSTEM_RESOURCES_CHECK_DATA_PTS,
            },
        };
        this.monitor = new SystemHealthMonitor(monitorConfig);
        console.log(`Monitoring memory usage (>${memoryThreshold}), cpu usage (>${cpuThreshold})`);
    }
    run() {
        const _this = this;
        this.monitor
            .start()
            .then(() => {
                setTimeout(() => {
                    setInterval(() => {
                        if (_this.monitor.isOverloaded()) {
                            const msg = `System overloaded detected in ${hostname}\nFree memory: ${Math.round(
                                _this.monitor.getMemFree() / 1024
                            )}Gb\nTotal memory: ${Math.round(
                                _this.monitor.getMemTotal() / 1024
                            )}Gb\nCPU utilization: ${_this.monitor.getCpuUsage()}%`;
                            console.log(msg);
                            telegramClient.sendMessage(msg);
                        } else {
                            const msg = `System stats in ${hostname} free memory ${Math.round(
                                _this.monitor.getMemFree() / 1024
                            )}Gb, total memory ${Math.round(
                                _this.monitor.getMemTotal() / 1024
                            )}Gb, CPU utilization ${_this.monitor.getCpuUsage()}%`;
                            console.log(msg);
                        }
                    }, config.SYSTEM_RESOURCES_CHECK_INTERVAL * 1000 * 60);
                }, (config.SYSTEM_RESOURCES_CHECK_DATA_PTS + 1) * config.SYSTEM_RESOURCES_CHECK_INTERVAL * 1000);
            })
            .catch((err) => {
                console.error("Error starting system monitor", err);
            });
    }
};
