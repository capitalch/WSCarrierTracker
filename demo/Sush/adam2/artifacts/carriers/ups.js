'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const parseString = require('xml2js').parseString;
const notify = require('../notify');

const ups = {};

const tools = {
    getUnifiedStatus: (status) => {
        const unifiedObj = {
            M: 'orderProcessed',
            D: 'delivered',
            I: 'inTransit',
            X: 'exception'
        };
        let ret = unifiedObj[status.toUpperCase()];
        ret || (ret = 'noStatus');
        return (ret);
    },
    getDamageActivity: (activities) => {
        let activity = null;
        if (activities) {
            if (Array.isArray(activities)) {
                activity = activities.find(
                    x => {
                        let desc = x.Status.StatusType.Description;
                        return desc && desc.toLowerCase().includes('damage')
                    });
            }
        }
        return (activity);
    },
    getRtsActivity: (activities) => {
        let activity = null;
        if (activities) {
            if (Array.isArray(activities)) {
                activity = activities.find(
                    x => {
                        let desc = x.Status.StatusType.Description;
                        return desc && desc.toLowerCase().includes('returned')
                    });
            }
        }
        return (activity);
    },
    getFirstActivity: (activities) => {
        let activity = null;
        if (activities) {
            if (Array.isArray(activities)) {
                (activities.length > 0) && (activity = activities[0]);
            } else {
                activity = activities;
            }
        }
        return activity;
    },
    getDeliveryActivity: (activities) => {
        let activity = null;
        if (activities) {
            if (Array.isArray(activities)) {
                activity = activities.find(
                    x => x.Status.StatusType.Code === 'D');
            }
        }
        return (activity);
    },
    getDate: (activity) => {
        let dateFormated = null;
        if (activity) {
            let date = activity.Date;
            dateFormated = date ? moment(date, 'YYYYMMDD').format("MMM. DD, YYYY") : '';
        }
        return dateFormated;
    },
    getTime: (activity) => {
        let timeFormated = null;
        if (activity) {
            let time = activity.Time;
            timeFormated = time ? moment(time, 'HHmmss').format("h:mm A") : '';
        }
        return timeFormated;
    },
    setXException: (activities, upsTemp) => {
        let activity = null;
        if (activities) {
            if (Array.isArray(activities)) {
                activity = activities.find(
                    x => x.Status.StatusType.Code === 'X');
            }
        }
        activity && (
            upsTemp.carrierStatusMessage = activity.Status.StatusType.Description,
            upsTemp.exceptionStatus = 1)
    },
    getEstimatedDeliveryDate: (packageResp) => {
        let estimatedDelDate = null;
        if (packageResp) {
            let date = packageResp.ScheduledDeliveryDate;
            date = date || packageResp.RescheduledDeliveryDate;
            if (date) {
                estimatedDelDate = date ? moment(date, 'YYYYMMDD').format("YYYY-MM-DD") : '';
            }
        }
        return estimatedDelDate || '1900-01-01';
    }
}

handler.sub20 = ibuki.filterOn('process-ups:api>ups')
    .subscribe(d => processUps(d.data));
handler.beforeCleanup(handler.sub20);

const processUps = (x) => {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            err.message = x.carrierName.concat(' Tracking number:', x.trackingNumber, ' parse error for response:', err.message);
            notify.pushError(err);
            notify.addApiErrDrop(x);
        } else {
            const response = result.TrackResponse.Response;
            if (response.ResponseStatusCode === '0') {
                const errorDescription = response.Error.ErrorDescription;
                const error = Error('UPS:' + x.trackingNumber + ' ' + errorDescription || '');
                handler.handleCarrierError(error, x);
            } else {
                handleUps(x, result);
            }
        }
    });
}

function handleUps(x, result) {
    const upsTemp = {
        rts: 0,
        damage: 0
    };
    upsTemp.estimatedDeliveryDate = tools.getEstimatedDeliveryDate(result.TrackResponse.Shipment.Package);
    const activities = result.TrackResponse.Shipment.Package.Activity;
    upsTemp.exceptionStatus = 0;
    //damage
    const damageActivity = tools.getDamageActivity(activities);
    // upsTemp.damage = 0;
    damageActivity && (
        upsTemp.damage = 1,
        upsTemp.exceptionStatus = 1,
        notify.incrException(x.carrierName),
        notify.incrDamage(x.carrierName),
        upsTemp.damageMsg = damageActivity.Status.StatusType.Description
    )
    //rts
    const rtsActivity = tools.getRtsActivity(activities);
    // upsTemp.rts = 0;
    rtsActivity && (
        upsTemp.exceptionStatus = 1,
        notify.incrReturn(x.carrierName),
        notify.incrException(x.carrierName),
        upsTemp.rts = 1
    )
    const startActivity = tools.getFirstActivity(activities);
    const statusCode = startActivity && startActivity.Status.StatusType.Code;
    upsTemp.carrierStatusCode = statusCode;
    upsTemp.carrierStatusMessage = startActivity && startActivity.Status.StatusType.Description;
    upsTemp.statusDate = tools.getDate(startActivity);
    upsTemp.statusTime = tools.getTime(startActivity);
    upsTemp.statusCode = statusCode;
    let deliveryActivity = tools.getDeliveryActivity(activities);
    switch (statusCode) {
        case 'D':
            notify.incrDelivered(x.carrierName);
            upsTemp.status = 'Delivered';
            upsTemp.deliverySignatureName = startActivity.ActivityLocation.SignedForByName;
            break;
        case 'I':
            notify.incrNotDelivered(x.carrierName);
            upsTemp.status = 'In Transit';
            break;
        case 'X':
            upsTemp.exceptionStatus = 1;
            notify.incrException(x.carrierName);
            if (deliveryActivity) {
                upsTemp.status = 'Delivered';
                notify.incrDelivered(x.carrierName);
                upsTemp.statusCode = deliveryActivity.Status.StatusType.Code;
                upsTemp.statusDate = tools.getDate(deliveryActivity);
                upsTemp.statusTime = tools.getTime(deliveryActivity);
                upsTemp.deliverySignatureName = deliveryActivity.ActivityLocation.SignedForByName;
            } else {
                notify.incrNotDelivered(x.carrierName);
                upsTemp.status = 'View Details'; //Check exception status code               
            }
            break;
        default:
            upsTemp.exceptionStatus = 1;
            notify.incrException(x.carrierName)
            notify.incrNotDelivered(x.carrierName);
            upsTemp.status = 'No Status';
    }
    tools.setXException(activities, upsTemp);
    const upsJson = {
        status: upsTemp.status || 'No Status',
        statusDate: upsTemp.statusDate || '',
        statusTime: upsTemp.statusTime || '',

        estimatedDeliveryDate: upsTemp.estimatedDeliveryDate||'1900-01-01',
        carrierStatusCode: upsTemp.statusCode || '',
        carrierStatusMessage: upsTemp.carrierStatusMessage || 'No Status',
        signedForByName: upsTemp.deliverySignatureName || '',

        exceptionStatus: upsTemp.exceptionStatus,
        rts: upsTemp.rts,
        rtsTrackingNo: '',
        damage: upsTemp.damage,
        damageMsg: upsTemp.damageMsg || '',
        carrierName:x.carrierName,
        shippingAgentCode: x.shippingAgentCode,
        trackingNumber: x.trackingNumber,
        rn: x.rn,
        activityJson: activities || null,
        unifiedStatus: statusCode ? tools.getUnifiedStatus(statusCode) || 'noStatus' : 'noStatus'
    };
    // upsTemp.exceptionStatus && (notify.addException(x.trackingNumber, upsTemp.status));
    if (notify.isSameStatus(x, upsJson)) {
        notify.addApiStatusDrop(x);
    } else {
        handler.buffer.next(upsJson);
    }
}

module.exports = ups;