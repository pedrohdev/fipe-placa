const tr = require('tor-request');
const axios = require("../config/axios")
const logger = require('../logger');
const getAgent = require('../utils/proxyAgent');

tr.TorControlPort.password = '510166';

class TorService {
    changeIP() {
        return new Promise((res, rej) => {
            try {
                tr.renewTorSession((err) => err ? console.log(err) : null);

                setTimeout(async () => {
                    try {
                        const response = await axios.get('https://api.ipify.org?format=json')

                        logger.info('Seu IP via Tor é:' + response.data.ip);

                        res(response.data.ip)
                    } catch (error) {
                        res(null)
                        console.log(error)
                    }

                }, 5000)
            } catch (error) {
                logger.error(error)
                rej(error)
            }
        })

    }
}

module.exports = new TorService()
