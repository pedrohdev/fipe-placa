const https = require('node:https');
const zlib = require('zlib');
const getAgent = require('./proxyAgent');
const logger = require('../logger');
const { URL } = require('node:url');

function httpsGet(url, headers = {}, proxy = undefined) {
    const { hostname, pathname } = new URL(url)

    var options = {
        hostname: hostname,
        port: 443,
        path: pathname,
        method: 'GET',
        headers: {
            ...headers
        },
        agent: proxy ? getAgent(proxy) : undefined
    };

    return new Promise((resolve, reject) => {


        const req = https.request(options, (res) => {
            let data = '';

            // Set the encoding to 'utf8' to ensure the response is in UTF-8
            const encoding = res.headers['content-encoding'];

            if (encoding && encoding.includes('gzip')) {
                // If it's gzip, use zlib to decompress the response
                res.pipe(zlib.createGunzip());
            } else {
                // If it's not compressed, proceed as normal
                res.setEncoding('utf8');
            }

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({ data, statusCode: res.statusCode });  // The response is in UTF-8 by default
            });
        })


        req.on('error', (e) => {
            logger.error(e);

            reject(e)
        });

        req.end();
    });
}


function httpsPost(url, data, headers = {}, proxy = undefined) {
    const { hostname, pathname } = new URL(url)

    var options = {
        hostname: hostname,
        port: 443,
        path: pathname,
        method: 'POST',
        headers: {
            'Content-Length': data.length,
            ...headers
        },
        agent: proxy ? getAgent(proxy) : undefined
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            // Set the encoding to 'utf8' to ensure the response is in UTF-8
            const encoding = res.headers['content-encoding'];

            /* if (encoding && encoding.includes('gzip')) {
                // If it's gzip, use zlib to decompress the response
                res.pipe(zlib.createGunzip());
            } else { */
            // If it's not compressed, proceed as normal
            res.setEncoding('ascii');
            /* } */

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({ data, statusCode: res.statusCode });  // The response is in UTF-8 by default
            });
        })


        req.on('error', (e) => {
            logger.error(e);

            reject(e)
        });

        req.write(data);
        req.end();
    });
}

module.exports = {
    httpsGet,
    httpsPost
}

