'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const handler = require('./handler');
const Q = require('q');
const notify = require('./notify');
const fex = require('./carriers/fex');
const gso = require('./carriers/gso');
const ups = require('./carriers/ups');

let api = {};

function processCarrierResponse(carrierInfo) {
    const carriermap = {
        fex: (x) => fex.processFex(x),
        ups: (x) => ups.processUps(x),
        gso: (x) => gso.processGso(x)
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
    // let x = api.axiosPost();
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

// const axiosPromise = axios.get(x.tokenUrl, x.config);
// .then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
// })

// api.axiosGetWithHeader = (x) => {
//     axios.get(carrierInfo.url, {
//             headers: {
//                 Token: carrierInfo.token,
//                 'Content-Type': 'application/json'
//             }
//         })
//         .then(res => {
//             //Save in database

//             config.buffer.next({
//                 trackingNumber: carrierInfo.trackingNumber,
//                 name: carrierInfo.name
//             });
//             ibuki.emit('parseXml:util:xmlParse', {
//                 response: res.data,
//                 carrierInfo: carrierInfo
//             });
//             //ibuki.emit('sql1-update:util>db1',{rn:1});
//             // flag && 
//             config.prepared.next(1);
//             flag = false;
//             config.carrierCount--;
//             config.responseCount++;
//             console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
//                 'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount), ' delay: ', config.piston
//             );
//         })
//         .catch(err => {
//             //log in database
//             config.carrierCount--;
//             config.errorCount++;
//             console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));
//         });

// }