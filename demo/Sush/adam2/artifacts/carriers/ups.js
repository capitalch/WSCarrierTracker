'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const parseString = require('xml2js').parseString;
const notify = require('../notify');

const ups = {};
const tools = {

}

ups.processUps = (x) => {
    handleUps(x);
}

function handleUps(x) {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 5))
        } else {
            const response = result.TrackResponse.Response;
            if (response.ResponseStatusCode === '0') {
                const errorDescription = response.Error.ErrorDescription
                ibuki.emit('app-error:any', handler.frameError({
                    name: 'apiCallError',
                    message: 'UPS:' + x.trackingNumber + ' ' + errorDescription
                }, 'util', 'info', 4));
            } else {
                const unifiedJson = {
                    name: 'fex',
                    trackingNumber: x.trackingNumber,
                    status: 'delivered',
                    dateTime: Date.now()
                };
                handler.buffer.next(unifiedJson);
            }
        }
    })
}

module.exports = ups;