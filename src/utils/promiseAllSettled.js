const pLimit = require('p-limit');


const executePromise = (array, limitConcurrency = 1) => {
    const limit = pLimit(limitConcurrency);

    return Promise.allSettled(array.map(promise => limit(() => promise))).then(res => res.filter(({ status }) => status == "fulfilled").map(({ value }) => value))
}

const delay = ms => new Promise((res) => setTimeout(res, ms))

module.exports = { executePromise, delay }