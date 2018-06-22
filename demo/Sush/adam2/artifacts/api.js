'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const util = require('./util');
const handler = require('./handler');
// const settings = require('../settings.json');

let api = {};

api.axiosGetWithHeader = (x) => {
    axios.get(carrierInfo.url, { headers: { Token: carrierInfo.token, 'Content-Type': 'application/json' } })
        .then(res => {
            //Save in database

            config.buffer.next({ trackingNumber: carrierInfo.trackingNumber, name: carrierInfo.name });
            ibuki.emit('parseXml:util:xmlParse', { response: res.data, carrierInfo: carrierInfo });
            //ibuki.emit('sql1-update:util>db1',{rn:1});
            // flag && 
            config.prepared.next(1);
            flag = false;
            config.carrierCount--;
            config.responseCount++;
            console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
                'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
                , ' delay: ', config.piston
            );
        })
        .catch(err => {
            //log in database
            config.carrierCount--;
            config.errorCount++;
            console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));
        });

}

api.axiosPost = (carrierInfo) => {
    axios.post(carrierInfo.url, carrierInfo.param)
        .then(res => {
            //Save in database
            carrierInfo.response = res.data;
            handler.carrierCount--;
            util.processCarrierResponse(carrierInfo);
            // ibuki.emit('parse-api-response:api>util', carrierInfo);
            // config.buffer.next({ trackingNumber: carrierInfo.trackingNumber, name: carrierInfo.carrierName });
            // ibuki.emit('parseXml:util:xmlParse', { response: res.data, carrierInfo: carrierInfo });
            //ibuki.emit('sql1-update:util>db1',{rn:1});
            // flag && 
            // config.prepared.next(1);
            // flag = false;
            // config.carrierCount--;
            // config.responseCount++;
            // console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
            //     'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
            //     , ' delay: ', config.piston
            // );
        })
        .catch(err => {
            handler.carrierCount--;
            ibuki.emit('app-error:any', handler.frameError(
                err
                , 'util', 'fatal', 5));
            //log in database
            // config.carrierCount--;
            // config.errorCount++;
            // console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));
        });
};

api.axiosGet = (carrierInfo) => {
    axios.get(carrierInfo.url)
        .then(res => {
            //Save in database

            config.buffer.next({
                trackingNumber: carrierInfo.trackingNumber,
                name: carrierInfo.name
            });
            ibuki.emit('parseXml:util:xmlParse', {
                response: res.data,
                carrierInfo: carrierInfo
            });
            //ibuki.emit('sql1-update:util>db1',{rn:1});
            // flag && 
            config.prepared.next(1);
            flag = false;
            config.carrierCount--;
            config.responseCount++;
            console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
                'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount), ' delay: ', config.piston
            );
        })
        .catch(err => {
            //log in database
            config.carrierCount--;
            config.errorCount++;
            console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));
        });
}
module.exports = api;