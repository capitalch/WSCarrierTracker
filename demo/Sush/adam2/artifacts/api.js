'use strict';
const axios = require('axios');
const _ = require('lodash');
const settings = require('../settings');
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
    fex: (x) => ibuki.emit('process-fex:api>fex', x),
    ups: (x) => ibuki.emit('process-ups:api>ups',x),
    gso: (x) => ibuki.emit('process-gso:api>gso',x),
    tps: (x) => ibuki.emit('process-tps:api>tps',x)
};
const timeout = _.has(settings, 'config.timeoutSec') ? settings.config.timeoutSec * 1000 : 5;

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

handler.sub15 = ibuki.filterOn('axios-post:workbench-fex>api').subscribe(d => {    
    const carrierInfo = d.data;
    notify.addApiRequest(carrierInfo);
    axios({
        method: 'post',
        url: carrierInfo.url,
        timeout: timeout,
        data: carrierInfo.param
    })
        .then(res => {
            handleApiResponse(carrierInfo, res);
        })
        .catch(err => {
            handleApiError(err, carrierInfo);
        });
})
handler.beforeCleanup(handler.sub15);

handler.sub16 = ibuki.filterOn('axios-get:workbench>api').subscribe(d => {    
    const carrierInfo = d.data;
    notify.addApiRequest(carrierInfo);
    carrierInfo.config && (carrierInfo.config.timeout = timeout)
    axios.get(carrierInfo.url, carrierInfo.config)
        .then(res => {
            handleApiResponse(carrierInfo, res);
        })
        .catch(err => {
            handleApiError(err, carrierInfo);
        });
});
handler.beforeCleanup(handler.sub16);

function handleApiResponse(carrierInfo, res) {
    carrierInfo.response = res.data;
    notify.addApiResponse(carrierInfo);
    carriermap[carrierInfo.carrierName](carrierInfo);
}

function handleApiError(err, carrierInfo) {
    err.message = carrierInfo.carrierName.toUpperCase().concat(':',carrierInfo.trackingNumber, ' error:', err.message || '');
    err.name = 'apiCallError';
    notify.pushError(err);
    notify.addApiError(carrierInfo);
    notify.incrException(carrierInfo.carrierName);
    notify.addApiErrDrop(carrierInfo);
}

module.exports = api;