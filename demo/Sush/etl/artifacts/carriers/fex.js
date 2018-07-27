'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
const fex = {};

handler.sub17 = ibuki.filterOn('process-fex:api>fex')
    .subscribe(d => processFex(d.data));
handler.beforeCleanup(handler.sub17);

const processFex = (x) => {
    let tempFex = {};
    let unifiedJsonArray = [];
    if (x.ActivityJson) {
        tempFex.activityJson = JSON.parse(x.ActivityJson);
    }
    if (tempFex.activityJson) {
        if (Array.isArray(tempFex.activityJson)) {
            tempFex.activityJson.forEach(key => {
                let activity = {};
                activity.Location = JSON.stringify(key.Address);
                activity.ActivityCode = key.EventType;
                activity.ActivityDetails = key.StatusExceptionDescription ? key.EventDescription + ' ' + key.StatusExceptionDescription : key.EventDescription;
                activity.ActivityDateTime = moment.parseZone(key.Timestamp).utc()
                    .format();
                unifiedJsonArray.push(activity);
            });
        } else {
            let activity = {};
            activity.Location = JSON.stringify(tempFex.activityJson.Address);
            activity.ActivityCode = tempFex.activityJson.EventType;
            activity.ActivityDetails = tempFex.activityJson.StatusExceptionDescription ? tempFex.activityJson.EventDescription + ' ' + tempFex.activityJson.StatusExceptionDescription : tempFex.activityJson.EventDescription;
            activity.ActivityDateTime = moment.parseZone(tempFex.activityJson.Timestamp).utc()
                .format();
            unifiedJsonArray.push(activity);
        }
        const fexJson = {
            ActivityJson: unifiedJsonArray,
            rn: x.rn,
            TrackingNumber: x.TrackingNumber,
            ShippingAgentCode: x.ShippingAgentCode,
            carrierName:x.carrierName
        };
        handler.buffer.next(fexJson);
    }
}
module.exports = fex;