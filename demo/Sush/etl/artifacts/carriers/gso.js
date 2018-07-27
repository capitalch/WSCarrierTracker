'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const gso = {};

handler.sub18 = ibuki.filterOn('process-gso:api>gso')
    .subscribe(d => processGso(d.data));
handler.beforeCleanup(handler.sub18);

const processGso = (x) => {
    let tempGso = {};
    let unifiedJsonArray = [];
    if (x.ActivityJson) {
        tempGso.activityJson = JSON.parse(x.ActivityJson);
    }
    if (tempGso.activityJson) {
        if (Array.isArray(tempGso.activityJson)) {
            tempGso.activityJson.forEach(key => {
                let activity = {};
                activity.Location = '';
                activity.ActivityCode = '';
                activity.ActivityDetails = key.Comments;
                activity.ActivityDateTime = moment(key.EventDate, 'MM/DD/YYYY h:mm A').utc()
                    .format();
                unifiedJsonArray.push(activity);
            });
        }
    }
    const gsoJson = {
        ActivityJson: unifiedJsonArray,
        rn: x.rn,
        TrackingNumber: x.TrackingNumber,
        ShippingAgentCode: x.ShippingAgentCode,
        carrierName:x.carrierName
    };
    handler.buffer.next(gsoJson);
}


module.exports = gso;