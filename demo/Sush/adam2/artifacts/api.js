'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const handler = require('./handler');
const Q = require('q');
const notify = require('./notify');
const fex = require('./carriers/fex');
const gso = require('./carriers/gso');
const ups = require('./carriers/ups');
const tps = require('./carriers/tps');

let api = {};

function processCarrierResponse(carrierInfo) {
    const carriermap = {
        fex: (x) => fex.processFex(x),
        ups: (x) => ups.processUps(x),
        gso: (x) => gso.processGso(x),
        tps: (x) => tps.processTps(x)
    }
    carriermap[carrierInfo.carrierName](carrierInfo);
}
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

handler.sub14 = ibuki.filterOn('axios-post:fex>api').subscribe(d => {
    api.axiosPost(d.data);
})

api.axiosPost = (carrierInfo) => {
    axios.post(carrierInfo.url, carrierInfo.param)
        .then(res => {
            //Save in database
            carrierInfo.response = res.data;
            notify.addApiResponse(carrierInfo);
            processCarrierResponse(carrierInfo);
        })
        .catch(err => {
            err.message = err.message.concat('. ', 'Carrier name:', carrierInfo.carrierName, ', Tracking number:', carrierInfo.trackingNumber);
            notify.pushError(err);
            notify.addApiError(carrierInfo);
            ibuki.emit('app-error:any', handler.frameError(
                err, 'api', 'info', 5));
        });
};

api.axiosGet = (carrierInfo) => {
    axios.get(carrierInfo.url, carrierInfo.config)
        .then(res => {
            //Save in database
            notify.addApiResponse(carrierInfo);
            carrierInfo.response = res.data;
            processCarrierResponse(carrierInfo);
        })
        .catch(err => {
            //log in database
            err.message = err.message.concat('. ', 'Carrier name:', carrierInfo.carrierName, ', Tracking number:', carrierInfo.trackingNumber);
            notify.pushError(err);
            notify.addApiError(carrierInfo);
            ibuki.emit('app-error:any', handler.frameError(
                err, 'api', 'info', 6));
        });
}

module.exports = api;
