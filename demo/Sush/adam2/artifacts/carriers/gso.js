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
    getShipmentInfo: (shipment) => {
        let ret = shipment;
        shipment && Array.isArray(shipment) && (ret = shipment[0]);
        return (ret);
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
        ibuki.emit('app-error:any', handler.frameError(x.response.StatusDescription, 'gso', 'info', 3));
    }
}

function handleGso(x) {
    let damage = 0,
        damageMsg = '',
        exceptionStatus = 0,
        rts = 0,
        rtsTrackingNo = '',
        statusDescription = '';
        // const gsoStatusCodes = tools.gsoStatusCodes();
        // const gsoExistingStatusCodes = tools.gsoExistingStatusCodes();

    const shipmentInfo = tools.getShipmentInfo(x.response.ShipmentInfo)
    const transitNotes = shipmentInfo.TransitNotes;
    
    const status = shipmentInfo.Delivery.TransitStatus;
    const deliveryDate = shipmentInfo.Delivery.DeliveryDate;
    const deliveryTime = shipmentInfo.Delivery.DeliveryTime;
    const mDate = deliveryDate ? moment(deliveryDate).format("MMM. DD, YYYY") : '';
    // const deliveryTime = shipmentInfo.Delivery.DeliveryTime;
    const mTime = deliveryTime ? moment(deliveryTime).format("h:mm A") : '';
    //ScheduledDeliveryDate and ScheduledDeliveryTime create date time and from that create estimatedDeliveryDate
    const estimatedDeliveryDate = '';

    // const mTimeStamp = deliveryTime ? moment(deliveryTime, "MM/DD/YYYY") : null;
    // const mDate = mTimeStamp ? mTimeStamp.format("MMM. DD, YYYY") : '';
    // const mTime = mTimeStamp ? mTimeStamp.format("h:mm A") : '';
    if (status.toUpperCase().includes('DELIVERED')) {
        notify.incrDelivery(x.carrierName);
    } else if (status.toUpperCase().includes('IN TRANSIT')) {
    //
    } else if (status.toUpperCase().includes('DELAYED')) {
        const expNote = tools.getException(transitNotes);
    } else {
        //
    }

    const gsoJson = {
        status: statusDescription || 'No Status',
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

    // const gsoJson1 = {
    //     status: statusCode ? gsoExistingStatusCodes[statusCode] || statusCode : 'noStatus',
    //     statusDate: mDate,
    //     statusTime: mTime, //from timestamp
    //     estimatedDeliveryDate: shipmentInfo.Delivery.ScheduledDeliveryDate || '1900-01-01',
    //     carrierStatusMessage: tools.getLastComments(transitNotes) || 'No Status',
    //     signedForByName: shipmentInfo.Delivery.SignedBy || '',
    //     exceptionStatus: exceptionStatus,
    //     rts: tools.getRts(transitNotes) || '',
    //     excepTrackingNo: rtsTrackingNo,
    //     shippingAgentCode: x.carrierName,
    //     trackingNumber: x.trackingNumber,
    //     rn: x.rn,
    //     activityJson: transitNotes || null,
    //     unifiedStatus: statusCode ? gsoStatusCodes[statusCode] || 'noStatus' : 'noStatus'
    // };
    handler.buffer.next(gsoJson);
}
module.exports = gso;