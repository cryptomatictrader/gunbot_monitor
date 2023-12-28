const config = require("config");
const os = require("os");
const hostname = os.hostname();
module.exports = config.get(hostname);
