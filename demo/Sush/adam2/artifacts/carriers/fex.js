'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const parseString = require('xml2js').parseString;
const notify = require('../notify');
// const db = require('../db'); //required
// const api = require('../api');
const fex = {};
const tools = {
    fexStatusCodes: () => {
        return ({
            AF: 'orderProcessed',
            AR: 'orderProcessed',
            CA: 'exception',
            DE: 'exception',
            DL: 'delivered',
            DP: 'inTransit',
            HA: 'inTransit',
            HP: 'inTransit',
            IT: 'inTransit',
            OC: 'inTransit',
            OD: 'inTransit',
            PU: 'PickedUp',
            RR: 'inTransit',
            RS: 'returned',
            HL: 'readyForPickup'
        });
    },
    timeStamp: (events) => {
        let timeStamp = null;
        if (events) {
            if (Array.isArray(events)) {
                timeStamp = events[0].Timestamp;
            } else {
                timeStamp = events.Timestamp;
            }
        }
        return (timeStamp);
    },
    getDamageEvent: (events) => {
        let event = null;
        if (events) {
            if (Array.isArray(events)) {
                event = events.find((x) =>
                    x.EventDescription && x.EventDescription.toLowerCase().includes('damage'))
            } else {
                event = events.EventDescription && events.EventDescription.toLowerCase().includes('damage') ? events : null;
            }
        }
        return (event);
    },
    getReturnIdentifier: (identifiers) => {
        let identifier = null;
        if (identifiers) {
            if (Array.isArray(identifiers)) {
                identifier = identifiers.find(x =>
                    x.Type === "RETURNED_TO_SHIPPER_TRACKING_NUMBER"
                );
            } else { // identifiers is an object
                identifier = identifiers.Type === "RETURNED_TO_SHIPPER_TRACKING_NUMBER" ? identifiers : null;
            }
        }
        return (identifier);
    },
    getReturnEvent: (events) => {
        let event = null;
        if (events) {
            if (Array.isArray(events)) {
                event = events.find(x =>
                    x.EventType === 'RS'
                )
            } else { //events is an object
                event = events.EventType && events.EventType === 'RS' ? events : null;
            }
        }
        return (event);
    },
    getException71Event: (events) => {
        let event = null;
        if (events) {
            if (Array.isArray(events)) {
                event = events.find(x => {
                    let ret = false;
                    if (x.StatusExceptionDescription) {
                        if ((x.StatusExceptionCode !== '71') && (!(x.StatusExceptionDescription.toLowerCase().includes('next scheduled tracking update')))) {
                            ret = true;
                        }
                    }
                    return (ret);
                });
            } else { // events is an object
                const isNot71 = events.StatusExceptionCode !== '71';
                const isNotScheduled = (events.StatusExceptionDescription) && (!events.StatusExceptionDescription.toLowerCase().includes('next scheduled tracking update'));
                if (events.StatusExceptionDescription) {
                    if (isNot71 && isNotScheduled) {
                        event = events;
                    }
                }
            }
        }
        return (event);
    }
}

handler.sub17 = ibuki.filterOn('process-fex:api>fex')
    .subscribe(d => processFex(d.data))

const processFex = (x) => {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            notify.pushError(err);
            notify.incrException(x.carrierName);
            const errorJson = notify.getErrorJson(err, x);
            handler.buffer.next(errorJson);
        } else {
            const notifications = result.TrackReply.Notifications;
            if ((notifications.Severity === 'ERROR') || (notifications.Severity === 'FAILURE')) {
                const error = Error('Fex:' + x.trackingNumber + ' ' + notifications.LocalizedMessage);
                notify.incrException(x.carrierName);
                const errorJson = notify.getErrorJson(error, x);
                handler.buffer.next(errorJson);
                // ibuki.emit('app-error:any', handler.frameError(error, 'util', 'info', 4))
            } else {
                checkMultiple(x, result);
            }
        }
    });
}

function checkMultiple(x, result) {
    const trackDetails = result.TrackReply.TrackDetails;
    if (Array.isArray(trackDetails) && trackDetails.length > 0) {
        const trackingNumberUniqueIdentifier = trackDetails[0].TrackingNumberUniqueIdentifier;
        x.param = x.param1.replace('$$$trackingUid', trackingNumberUniqueIdentifier);
        ibuki.emit('axios-post:workbench-fex>api', x);
    } else {
        handleFex(x, result);
    }
}

function handleFex(x, result) {
    //things are fine. Create unified json object and push it to buffer to be updated in database
    const trackDetails = result.TrackReply.TrackDetails;
    const fexStatusCodes = tools.fexStatusCodes();
    const events = trackDetails.Events;
    const otherIdentifiers = trackDetails.OtherIdentifiers;
    let statusCode = trackDetails.StatusCode;
    let timeStamp = tools.timeStamp(events);
    let damage = 0,
        damageMsg = '',
        exceptionStatus = 0,
        returnEvent = null,
        rts = 0,
        rtsTrackingNo = '',
        statusDescription = ''; //trackDetails.StatusDescription;
    const checkExceptions = () => {
        // check damage
        const damageEvent = tools.getDamageEvent(events);
        damageEvent && (
            notify.incrDamage(x.carrierName),
            notify.incrException(x.carrierName),
            exceptionStatus = 1,
            damage = 1,
            timeStamp = damageEvent.Timestamp,
            damageMsg = damageEvent.EventDescription
        );
        // check return
        const returnIdentifier = tools.getReturnIdentifier(otherIdentifiers);
        returnIdentifier && (
            notify.incrReturn(x.carrierName),
            notify.incrException(x.carrierName),
            exceptionStatus = 1,
            rts = 1,
            rtsTrackingNo = returnIdentifier.Value,
            statusDescription = "Package returned to shipper: ".concat(rtsTrackingNo), //carrierStatusMessage
            returnEvent = tools.getReturnEvent(events),
            timeStamp = returnEvent && returnEvent.Timestamp ? returnEvent.Timestamp : timeStamp,
            statusCode = returnEvent.StatusExceptionCode
        );
        //check exception 71
        const exception71Event = tools.getException71Event(events);
        exception71Event && (
            notify.incrException(x.carrierName),

            exception71Event.StatusExceptionDescription && (statusDescription = exception71Event.StatusExceptionDescription.substr(0, 49)),
            exceptionStatus = 1,
            timeStamp = exception71Event.Timestamp
        );
    }

    if (statusDescription) {
        if (statusDescription.toLowerCase().includes('delivered')) {
            notify.incrDelivered(x.carrierName);
        } else {
            checkExceptions();
        }
    } else {
        notify.incrException(x.carrierName);
    }

    const mTimeStamp = timeStamp ? moment(timeStamp) : null;
    const mDate = mTimeStamp ? mTimeStamp.format("MMM. DD, YYYY") : '';
    const mTime = mTimeStamp ? mTimeStamp.format("h:mm A") : '';
    const fexJson = {
        status: statusCode ? fexStatusCodes[statusCode] || 'noStatus' : 'noStatus', //statusDescription || 'No Status',
        statusDate: mDate, //from timeStamp
        statusTime: mTime, //from timestamp

        estimatedDeliveryDate: trackDetails.estimatedDeliveryDate || '1900-01-01',
        carrierStatusCode: statusCode || '',
        carrierStatusMessage: statusDescription || 'No Status',
        signedForByName: trackDetails.DeliverySignatureName || '',

        exceptionStatus: exceptionStatus,
        rts: rts,
        rtsTrackingNo: rtsTrackingNo,
        damage: damage,
        damageMsg: damageMsg,

        shippingAgentCode: x.carrierName,
        trackingNumber: x.trackingNumber,
        rn: x.rn,
        activityJson: events || null,
        unifiedStatus: statusCode ? fexStatusCodes[statusCode] || 'noStatus' : 'noStatus'
    }
    if (notify.isSameStatus(x, fexJson)) {
        notify.addApiStatusDrop(x);
    } else {
        handler.buffer.next(fexJson);
    }
}

module.exports = fex;