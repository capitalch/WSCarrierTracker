'use strict';
const ibuki = require('../ibuki');
const handler = require('../handler');
const parseString = require('xml2js').parseString;
const notify = require('../notify');

const tps = {};
tps.processTps = (x) => {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            notify.pushError(err);
            notify.incrException(x.carrierName);
            const errorJson = notify.getErrorJson(err, x);
            handler.buffer.next(errorJson);
            ibuki.emit('app-error:any', handler.frameError(err, 'tps', 'info', 3))
        } else {
            const errorNode = result.TrackResponse.TrackInfo.Error;
            if (errorNode) {
                const error = {
                    name: 'apiCallError',
                    message: 'TPS:' + x.trackingNumber + ' ' + errorNode.Description
                };
                notify.incrException(x.carrierName);
                const errorJson = notify.getErrorJson(error, x);
                handler.buffer.next(errorJson);
                // ibuki.emit('app-error:any', handler.frameError(error, 'tps', 'info', 4))
            } else {
                handleTps(x, result);
            }

        }
    });
}
function handleTps(x, result) {
    const mNodelist = result.TrackResponse.TrackInfo.TrackSummary;
    let statusDescription = null;
    let statusDate = '',
        statusTime = '';
    let event = null;
    if (mNodelist) {
        if (Array.isArray(mNodelist)) {
            event = mNodelist.find(x =>
                x.Event === 'DELIVERED'
            )
        }
    }
    if (event) {
        notify.incrDelivered(x.carrierName);
        statusDescription = event.Event;
        statusDate = event.EventDate;
        statusTime = event.EventTime;
    } else {
        notify.incrNotDelivered(x.carrierName);
    }
    const tpsJson = {
        status: statusDescription || 'No Status',
        statusDate: statusDate || '',
        statusTime: statusTime || '', 
        estimatedDeliveryDate: '1900-01-01',
        carrierStatusCode:  '',
        carrierStatusMessage: statusDescription || 'No Status',
        signedForByName: '',
        exceptionStatus: '',
        rts: 0,
        rtsTrackingNo: 0,
        damage: '',
        damageMsg: '',
        shippingAgentCode: x.carrierName,
        trackingNumber: x.trackingNumber,
        rn: x.rn,
        activityJson: mNodelist || null,
        unifiedStatus: statusDescription || 'No Status'
    }

    handler.buffer.next(tpsJson);

}
module.exports = tps;