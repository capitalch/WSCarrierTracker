'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const notify = require('../notify');

const gso = {};
const tools = {
    gsoStatusCodes: () => {
        return ({
            'IN TRANSIT': 'inTransit',
            'DELAYED': 'inTransit',
            'DELIVERED': 'delivered',
            'RETURNED': 'returned'
        });
    },
    gsoExistingStatusCodes: () => {
        return ({
            'IN TRANSIT': 'In Transit',
            'DELAYED': 'Delayed',
            'DELIVERED': 'Delivered'
        });
    },
    shipmentInfo: (shipment) => {
        let ret = shipment;
        shipment && Array.isArray(shipment) && (ret = shipment[0]);
        return (ret);
        // if (shipment && Array.isArray(shipment)) {
        //     return shipment[0];
        // } else {
        //     return shipment;
        // }
    },
    getLastComments: (transitNotes) => {
        let ret = '';
        transitNotes && Array.isArray(transitNotes) && (ret = transitNotes[transitNotes.length - 1].Comments);
        return (ret);
        // if (transitNotes && Array.isArray(transitNotes)) {
        //     return transitNotes[transitNotes.length - 1].Comments;
        // } else {
        //     return '';
        // }
    },
    getRts: (transitNotes) => {
        let rts = 0;
        if (transitNotes && Array.isArray(transitNotes)) {
            const rtsNote = transitNotes.find((x) =>
                x.Comments && x.Comments.toUpperCase().includes('RTS')
            );
            rtsNote && (rts = 1);
        }
        return (rts);
    },
    getException: (transitNotes) => {
        let note = null;
        if (transitNotes && Array.isArray(transitNotes)) {
            note = transitNotes.find((x) =>
                x.Comments && x.Comments.toUpperCase().includes('DEL ATTEMPTED')
            );
        }
        return note;
    }
}
gso.processGso = (x) => {
    if (x.response.StatusCode === 200) {
        handleGso(x);
    } else {
        ibuki.emit('app-error:any', handler.frameError(x.response.StatusDescription, 'util', 'info', 3));
    }
}

function handleGso(x) {
    let damage = 0,
        damageMsg = '',
        exceptionStatus = 0,
        rts = 0,
        rtsTrackingNo = '',
        statusDescription = '';
    const shipmentInfo = tools.shipmentInfo(x.response.ShipmentInfo)
    const gsoStatusCodes = tools.gsoStatusCodes();
    const gsoExistingStatusCodes = tools.gsoExistingStatusCodes();
    const transitNotes = shipmentInfo.TransitNotes;
    let statusCode = shipmentInfo.Delivery.TransitStatus;
    const deliveryTime = shipmentInfo.Delivery.DeliveryDate;
    const mTimeStamp = deliveryTime ? moment(deliveryTime, "MM/DD/YYYY") : null;
    const mDate = mTimeStamp ? mTimeStamp.format("MMM. DD, YYYY") : '';
    const mTime = mTimeStamp ? mTimeStamp.format("h:mm A") : '';
    if (statusCode.toUpperCase().includes('DELIVERED')) {
        notify.incrDelivery(x.carrierName);
    } else if (statusCode.toUpperCase().includes('IN TRANSIT')) {

    } else if (statusCode.toUpperCase().includes('DELAYED')) {
        const expNote = tools.getException(transitNotes);
    }

    const gsoJson = {
        status: statusCode ? gsoExistingStatusCodes[statusCode] || statusCode : 'noStatus',
        statusDate: mDate,
        statusTime: mTime, //from timestamp
        estimatedDeliveryDate: shipmentInfo.Delivery.ScheduledDeliveryDate || '1900-01-01',
        carrierStatusMessage: tools.getLastComments(transitNotes) || 'No Status',
        signedForByName: shipmentInfo.Delivery.SignedBy || '',
        exceptionStatus: exceptionStatus,
        rts: tools.getRts(transitNotes) || '',
        excepTrackingNo: rtsTrackingNo,
        shippingAgentCode: x.carrierName,
        trackingNumber: x.trackingNumber,
        rn: x.rn,
        activityJson: transitNotes || null,
        unifiedStatus: statusCode ? gsoStatusCodes[statusCode] || 'noStatus' : 'noStatus'
    };
    handler.buffer.next(gsoJson);
}
module.exports = gso;