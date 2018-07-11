'use strict';
const _ = require('lodash');
const ibuki = require('../ibuki');
// const ibuki = require('../ibuki');
const handler = require('../handler');
const parseString = require('xml2js').parseString;
const notify = require('../notify');
// const db = require('../db'); //required

const tps = {};
handler.sub19 = ibuki.filterOn('process-tps:api>tps')
    .subscribe(d => processTps(d.data));
handler.beforeCleanup(handler.sub19);

const processTps = (x) => {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            err.message = x.carrierName.concat(' Tracking number:', x.trackingNumber, ' parse error for response:', err.message);
            notify.pushError(err);
            notify.addApiErrDrop(x);
            // notify.incrException(x.carrierName);
            // const errorJson = notify.getErrorJson(err, x);
            // handler.buffer.next(errorJson);
        } else {
            let error = null;
            if (_.has(result, 'TrackResponse.TrackInfo.Error')) {
                const errorNode = result.TrackResponse.TrackInfo.Error;
                error = Error('TPS:' + x.trackingNumber + ' ' + errorNode.Description);
                error.name = 'apiCallError';
            } else if (_.has(result, 'Error')) {
                error = result.Error;
                error.message = (error.message || '').concat(' TPS:', x.trackingNumber)
            }

            if (error) {
                handler.handleCarrierError(error,x);
                // notify.incrException(x.carrierName);
                // const errorJson = notify.getErrorJson(error, x);
                // handler.buffer.next(errorJson);
            } else {
                handleTps(x, result);
            }
        }
    });
}

function handleTps(x, result) {
    const isTrackSummary = _.has(result,'TrackResponse.TrackInfo.TrackSummary');
    const mNodelist = isTrackSummary ? result.TrackResponse.TrackInfo.TrackSummary : null;
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
        carrierStatusCode: '',
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
    if (notify.isSameStatus(x, tpsJson)) {
        notify.addApiStatusDrop(x);
    } else {
        handler.buffer.next(tpsJson);
    }
}
module.exports = tps;