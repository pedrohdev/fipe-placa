const axios = require("axios");
const getAgent = require("../utils/proxyAgent");

let proxy = "socks5h://127.0.0.1:9050"

let agent = getAgent(proxy)

module.exports = axios.create({ httpsAgent: getAgent(proxy), httpAgent: agent, httpsAgent: agent })