'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const notify = require('../notify');
// const db = require('../db'); //required
const gso = {};
const tools = {
    getUnifiedStatus: (status) => {
        const unifiedObj = {
            'IN TRANSIT': 'inTransit',
            'DELAYED': 'inTransit',
            'DELIVERED': 'delivered',
            'RETURNED': 'returned'
        };
        let ret = unifiedObj[status.toUpperCase()];
        ret || (ret = 'noStatus');
        return (ret);
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
        notify.incrException(x.carrierName);
        const error = handler.frameError({
            message: x.response.StatusDescription,
            name: 'apiCallError'
        }, 'gso', 'info', 3);
        const errorJson = notify.getErrorJson(error, x);
        handler.buffer.next(errorJson);
        ibuki.emit('app-error:any', error);
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
    gsoTemp.estimatedDeliveryDate = scheduledDeliveryDate ? moment(scheduledDeliveryDate, 'MM/DD/YYYY').format("YYYY-MM-DD") : '1900-01-01';
    gsoTemp.signedBy = delivery.SignedBy;
    gsoTemp.lastComments = tools.getLastComments(transitNotes);

    if (status.includes('DELIVERED')) {
        notify.incrDelivered(x.carrierName);
        gsoTemp.status = 'Delivered';
    } else if (status.includes('IN TRANSIT')) {
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

    gsoTemp.rts = tools.getRts();
    gsoTemp.rts && (notify.incrReturn(x.carrierName));
    const gsoJson = {
        status: gsoTemp.status || 'No Status',
        statusDate: gsoTemp.statusDate || '',
        statusTime: gsoTemp.statusTime || '',
        estimatedDeliveryDate: gsoTemp.estimatedDeliveryDate || '1900-01-01',
        carrierStatusCode: '', //gsoTemp.status || 'No Status'
        carrierStatusMessage: gsoTemp.lastComments || '',
        signedForByName: gsoTemp.signedBy || '',

        exceptionStatus: gsoTemp.exceptionStatus || 0,
        rts: gsoTemp.rts,
        rtsTrackingNo: '',
        damage: 0,
        damageMsg: '',

        shippingAgentCode: x.carrierName,
        trackingNumber: x.trackingNumber,
        rn: x.rn,
        activityJson: transitNotes || null,
        unifiedStatus: gsoTemp.status ? tools.getUnifiedStatus(gsoTemp.status) : 'noStatus'
    }
    if (notify.isSameStatus(x, gsoJson)) {
        notify.addApiDrop(x);
    } else {
        handler.buffer.next(gsoJson);
    }
}

module.exports = gso;