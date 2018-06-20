'use strict';

let api = {};
api.axiosPost = (carrierInfo) => {
    axios.post(carrierInfo.url, carrierInfo.param)
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
module.exports = api;