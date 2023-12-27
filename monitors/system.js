const SystemHealthMonitor = require("system-health-monitor");
const config = require("config");
const telegramClient = require("../helpers/telegram_client");

module.exports = class SystemMonitor {
    constructor() {
        const monitorConfig = {
            checkIntervalMsec: config.get("SYSTEM_RESOURCES_CHECK_INTERVAL") * 1000,
            mem: {
                thresholdType: "rate",
                highWatermark: config.get("MEMORY_THRESHOLD"),
            },
            cpu: {
                thresholdType: "rate",
                highWatermark: config.get("CPU_THRESHOLD"),
                calculationAlgo: "sma",
                periodPoints: config.get("SYSTEM_RESOURCES_CHECK_DATA_PTS"),
            },
        };
        this.monitor = new SystemHealthMonitor(monitorConfig);
        console.log(`Monitoring memory usage (>${config.get("MEMORY_THRESHOLD")}), cpu usage (>${config.get("CPU_THRESHOLD")})`);
    }
    run() {
        const _this = this;
        this.monitor
            .start()
            .then(() => {
                setTimeout(() => {
                    setInterval(() => {
                        if (_this.monitor.isOverloaded()) {
                            const msg = `System overloaded - free memory ${Math.round(
                                _this.monitor.getMemFree() / 1024
                            )}Gb, total memory ${Math.round(
                                _this.monitor.getMemTotal() / 1024
                            )}Gb, CPU utilization ${_this.monitor.getCpuUsage()}%`;
                            console.log(msg);
                            telegramClient.sendMessage(msg);
                        } else {
                            const msg = `free memory ${Math.round(_this.monitor.getMemFree() / 1024)}Gb, total memory ${Math.round(
                                _this.monitor.getMemTotal() / 1024
                            )}Gb, CPU utilization ${_this.monitor.getCpuUsage()}%`;
                            console.log(msg);
                        }
                    }, config.get("SYSTEM_RESOURCES_CHECK_INTERVAL") * 1000 * 60);
                }, (config.get("SYSTEM_RESOURCES_CHECK_DATA_PTS") + 1) * config.get("SYSTEM_RESOURCES_CHECK_INTERVAL") * 1000);
            })
            .catch((err) => {
                console.error("Error starting system monitor", err);
            });
    }
};
