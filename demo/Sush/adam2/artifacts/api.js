'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const handler = require('./handler');
const Q = require('q');
const notify = require('./notify');
const db = require('./db'); // needed
const fex = require('./carriers/fex');
const gso = require('./carriers/gso');
const ups = require('./carriers/ups');
const tps = require('./carriers/tps');

let api = {};
const carriermap = {
    fex: (x) => fex.processFex(x),
    ups: (x) => ups.processUps(x),
    gso: (x) => gso.processGso(x),
    tps: (x) => tps.processTps(x)
};

api.getGsoTokenPromises = (info) => {
    const accounts = info.accounts;
    const promises = accounts.map(x => {
        const config = {
            headers: {
                'AccountNumber': x.accountNumber,
                'UserName': x.userName,
                'Password': x.password
            }
        };
        const promise = axios.get(info.tokenUrl, config);
        return (promise);
    });
    return (Q.allSettled(promises)); //Even if error is encountered in a promise still other promises are handled
}

// handler.sub13 = ibuki.filterOn('axios-post:fex>api').subscribe(d => {
//     api.axiosPost(d.data);
// })

handler.sub15 = ibuki.filterOn('axios-post:workbench-fex>api').subscribe(d => {
    const carrierInfo = d.data;
    notify.addApiRequest(carrierInfo);
    axios({
            method: 'post',
            url: carrierInfo.url,
            timeout: 10000,
            data: carrierInfo.param
        })
        .then(res => {
            handleApiResponse(carrierInfo, res);
        })
        .catch(err => {
            handleApiError(carrierInfo, err);
        });
})

handler.sub16 = ibuki.filterOn('axios-get:workbench>api').subscribe(d => {
    const carrierInfo = d.data;
    notify.addApiRequest(carrierInfo);
    carrierInfo.config && (carrierInfo.config.timeout = 10000)
    axios.get(carrierInfo.url, carrierInfo.config)
        .then(res => {
            handleApiResponse(carrierInfo, res);
        })
        .catch(err => {
            handleApiError(carrierInfo, err);
        });
})

function handleApiResponse(carrierInfo, res) {
    carrierInfo.response = res.data;
    notify.addApiResponse(carrierInfo);
    carriermap[carrierInfo.carrierName](carrierInfo);
}

function handleApiError(carrierInfo, err) {
    err.message = err.message.concat('. ', 'Carrier name:', carrierInfo.carrierName, ', Tracking number:', carrierInfo.trackingNumber);
    err.name = 'apiCallError';
    notify.pushError(err);
    notify.addApiError(carrierInfo);
    notify.incrException(carrierInfo.carrierName);
    const errorJson = notify.getErrorJson(err, carrierInfo);
    handler.buffer.next(errorJson);
}

module.exports = api;