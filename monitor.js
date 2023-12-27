require("console-stamp")(console);
const IpMonitor = require("./monitors/ip");
const GunbotMonitor = require("./monitors/gunbot");
const SystemMonitor = require("./monitors/system");
const ErrorMonitor = require("./monitors/error");
const NetworkMonitor = require("./monitors/network");
const DiskMonitor = require("./monitors/disk");

console.log("Gunbot monitor started");

new IpMonitor().run();
new GunbotMonitor().run();
new SystemMonitor().run();
new ErrorMonitor().run();
new NetworkMonitor().run();
new DiskMonitor().run();
