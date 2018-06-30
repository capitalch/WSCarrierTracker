'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const notify = require('../notify');

const gso = {};
const tools = {
    getGsoStatusCodes: () => {
        return ({
            'IN TRANSIT': 'inTransit',
            'DELAYED': 'inTransit',
            'DELIVERED': 'delivered'
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
    const gsoTemp = {};
    const shipmentInfo = tools.getShipmentInfo(x.response.ShipmentInfo);
    const delivery = shipmentInfo.Delivery;
    const transitNotes = shipmentInfo.TransitNotes;
    const status = delivery.TransitStatus.toUpperCase();
    const deliveryDate = delivery.DeliveryDate;
    const deliveryTime = delivery.DeliveryTime;
    
    gsoTemp.statusDate = deliveryDate ? moment(deliveryDate, 'MM/DD/YYYY').format("MMM. DD, YYYY") : '';
    gsoTemp.statusTime = deliveryTime ? moment(deliveryTime, 'h:mm A').format("h:mm A") : '';
    const scheduledDeliveryDate = delivery.ScheduledDeliveryDate;
    gsoTemp.estimatedDeliveryDate = scheduledDeliveryDate ? moment(scheduledDeliveryDate, 'MM/DD/YYYY').format("MMM. DD, YYYY") : '1900-01-01';
    gsoTemp.signedBy = delivery.SignedBy;
    gsoTemp.lastComments = tools.getLastComments(transitNotes);
    
    if (status.includes('DELIVERED')) {
        notify.incrDelivery(x.carrierName);
        gsoTemp.status = 'Delivered';
    } else if (status.includes('IN_TRANSIT')) {
        notify.incrNotDelivered(x.carrierName);
        gsoTemp.status = 'In Transit';
    } else if (status.includes('DELAYED')) {
        gsoTemp.status = 'Delayed';
        notify.incrNotDelivered(x.carrierName);
        if (gsoTemp.lastComments.toUpperCase().includes('DEL ATTEMPTED')) {
            gsoTemp.exceptionStatus = 1;
            notify.incrException(x.carrierName);
        }
    } else {
        gsoTemp.exceptionStatus = 1;
        notify.incrException(x.carrierName);
    }

    const gsoJson = {
        status: gsoTemp.status || 'No Status',
        statusDate: gsoTemp.statusDate || '',
        statusTime: gsoTemp.statusTime || '',
        estimatedDeliveryDate: gsoTemp.estimatedDeliveryDate || '1900-01-01',
        carrierStatusCode: gsoTemp.status || 'No Status',
        carrierStatusMessage: gsoTemp.lastComments || '',
        signedForByName: gsoTemp.signedBy || '',

        exceptionStatus: gsoTemp.exceptionStatus || 0,
        rts: tools.getRts(),
        rtsTrackingNo:'' ,
        damage: 0,
        damageMsg: '',

        shippingAgentCode: x.carrierName,
        trackingNumber: x.trackingNumber,
        rn: x.rn,
        activityJson: transitNotes || null,
        unifiedStatus: gsoTemp.status ? tools.getGsoStatusCodes[gsoTemp.status] || 'noStatus' : 'noStatus'
    }
    handler.buffer.next(gsoJson);
}
module.exports = gso;