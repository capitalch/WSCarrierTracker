'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');

const ups = {};
const tools = {   
    getDateTime: (activity) => {
        let dateFormated = null;
        if (activity) {
            let dateTime = activity.Date+' '+activity.Time;
            dateFormated = dateTime ? 
            moment(dateTime,'YYYYMMDD HHmmss').utc()
            .format():
            '';
        }
        return dateFormated;
    }
}

handler.sub20 = ibuki.filterOn('process-ups:api>ups')
    .subscribe(d => processUps(d.data));
handler.beforeCleanup(handler.sub20);

const processUps = (x) => {
    let tempUps = {};
    let unifiedJsonArray = [];
    if (x.ActivityJson) {
        tempUps.activityJson = JSON.parse(x.ActivityJson);
    }
    if (tempUps.activityJson) {
        if (Array.isArray(tempUps.activityJson)) {
            tempUps.activityJson.forEach(key => {
                let activity = {};
                activity.Location = JSON.stringify(key.ActivityLocation.Address);
                activity.ActivityCode = key.Status.StatusType.Code;
                activity.ActivityDetails =key.Status.StatusType.Description;

                activity.ActivityDateTime =tools.getDateTime(key);
                unifiedJsonArray.push(activity);
            });
        }
    }
    const upsJson = {
        ActivityJson: unifiedJsonArray,
        rn: x.rn,
        TrackingNumber: x.TrackingNumber,
        ShippingAgentCode: x.ShippingAgentCode,
        carrierName:x.carrierName
    };
    handler.buffer.next(upsJson);
}

module.exports = ups;