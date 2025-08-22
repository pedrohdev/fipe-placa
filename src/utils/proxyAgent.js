const { SocksProxyAgent } = require('socks-proxy-agent');
const logger = require("../logger");

const getAgent = (proxy) => {
    try {
        return new SocksProxyAgent(proxy);
    } catch (error) {
        logger.error(error);
        return null;
    }
}

module.exports = getAgent