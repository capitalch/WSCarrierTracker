'use strict';
// const moment = require('moment');
const ibuki = require('./ibuki');
const handler = require('./handler');
const parseString = require('xml2js').parseString;
// const notify = require('./notify');
const fex = require('./carriers/fex');

let util = {};

// util.processCarrierResponse = (carrierInfo) => {
//     const carriermap = {
//         fex: fex.processFex,
//         ups: processUps,
//         gso: processGso
//     }
//     carriermap[carrierInfo.carrierName](carrierInfo);
// }

util.processGso = (x) =>{
    const unifiedJson = {
        name: 'fex',
        trackingNumber: x.trackingNumber,
        status: 'delivered',
        dateTime: Date.now()
    };
    handler.buffer.next(unifiedJson);
}

util.processUps = (x) => {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 5))
        } else {
            const response = result.TrackResponse.Response;
            if (response.ResponseStatusCode === '0') {
                const errorDescription = response.Error.ErrorDescription
                ibuki.emit('app-error:any', handler.frameError({
                    name: 'apiCallError',
                    message: 'UPS:' + x.trackingNumber + ' ' + errorDescription
                }, 'util', 'info', 4));
            } else {
                const unifiedJson = {
                    name: 'fex',
                    trackingNumber: x.trackingNumber,
                    status: 'delivered',
                    dateTime: Date.now()
                };
                handler.buffer.next(unifiedJson);
            }
        }
    })
}

module.exports = util;

// const fexTools = {
//     // fex: {
//     fexStatusCodes: () => {
//         return ({
//             AF: 'orderProcessed',
//             AR: 'orderProcessed',
//             CA: 'exception',
//             DE: 'exception',
//             DL: 'delivered',
//             DP: 'inTransit',
//             HA: 'inTransit',
//             HP: 'inTransit',
//             IT: 'inTransit',
//             OC: 'inTransit',
//             OD: 'inTransit',
//             PU: 'PickedUp',
//             RR: 'inTransit',
//             RS: 'returned',
//             HL: 'readyForPickup'
//         });
//     },
//     timeStamp: (events) => {
//         let timeStamp = null;
//         if (events) {
//             if (Array.isArray(events)) {
//                 timeStamp = events[0].Timestamp;
//             } else {
//                 timeStamp = events.Timestamp;
//             }
//         }
//         return (timeStamp);
//     },
//     getDamageEvent: (events) => {
//         let event = null;
//         if (events) {
//             if (Array.isArray(events)) {
//                 event = events.find((x) =>
//                     x.EventDescription && x.EventDescription.toLowerCase().includes('damage'))
//             } else {
//                 event = events.EventDescription && events.EventDescription.toLowerCase().includes('damage') ? events : null;
//             }
//         }
//         return (event);
//     },
//     getReturnIdentifier: (identifiers) => {
//         let identifier = null;
//         if (identifiers) {
//             if (Array.isArray(identifiers)) {
//                 identifier = identifiers.find(x =>
//                     x.Type === "RETURNED_TO_SHIPPER_TRACKING_NUMBER"
//                 );
//             } else { // identifiers is an object
//                 identifier = identifiers.Type === "RETURNED_TO_SHIPPER_TRACKING_NUMBER" ? identifiers : null;
//             }
//         }
//         return (identifier);
//     },
//     getReturnEvent: (events) => {
//         let event = null;
//         if (events) {
//             if (Array.isArray(events)) {
//                 event = events.find(x =>
//                     x.EventType === 'RS'
//                 )
//             } else { //events is an object
//                 event = events.EventType && events.EventType === 'RS' ? events : null;
//             }
//         }
//         return (event);
//     },
//     getException71Event: (events) => {
//         let event = null;
//         if (events) {
//             if (Array.isArray(events)) {
//                 event = events.find(x => {
//                     let ret = false;
//                     if (x.StatusExceptionDescription) {
//                         if ((x.StatusExceptionCode !== '71') && (!(x.StatusExceptionDescription.toLowerCase().includes('next scheduled tracking update')))) {
//                             ret = true;
//                         }
//                     }
//                     return (ret);
//                 });
//             } else { // events is an object
//                 const isNot71 = events.StatusExceptionCode !== '71';
//                 const isNotScheduled = !events.StatusExceptionDescription.toLowerCase().includes('next scheduled tracking update');
//                 if (events.StatusExceptionDescription) {
//                     if (isNot71 && isNotScheduled) {
//                         event = events;
//                     }
//                 }
//             }
//         }
//         return (event);
//     }
//     // }
// }
// function processFex(x) {
//     parseString(x.response, {
//         trim: true,
//         explicitArray: false
//     }, function (err, result) {
//         if (err) {
//             ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 3))
//         } else {
//             const notifications = result.TrackReply.Notifications;
//             if ((notifications.Severity === 'ERROR') || (notifications.Severity === 'FAILURE')) {
//                 ibuki.emit('app-error:any', handler.frameError({
//                     name: 'apiCallError',
//                     message: 'Fex:' + x.trackingNumber + ' ' + notifications.LocalizedMessage
//                 }, 'util', 'info', 4))
//             } else {
//                 handleFex(x, result);
//             }
//         }
//     });
// }

// function handleFex(x, result) {
//     //things are fine. Create unified json object and push it to buffer to be updated in database
//     const trackDetails = result.TrackReply.TrackDetails;
//     const fexStatusCodes = fexTools.fexStatusCodes();
//     const events = trackDetails.Events;
//     const otherIdentifiers = trackDetails.OtherIdentifiers;
//     let statusCode = trackDetails.StatusCode;
//     let timeStamp = fexTools.timeStamp(events);
//     let damage = 0,
//         damageMsg = '',
//         exceptionStatus = 0,
//         returnEvent = null,
//         rts = 0,
//         rtsTrackingNo = '',
//         statusDescription = trackDetails.StatusDescription;
//     const checkExceptions = () => {
//         // check damage
//         const damageEvent = fexTools.getDamageEvent(events);
//         damageEvent && (
//             notify.incrDamage(x.carrierName),
//             notify.incrException(x.carrierName),
//             exceptionStatus = 1,
//             damage = 1,
//             timeStamp = damageEvent.Timestamp,
//             damageMsg = damageEvent.EventDescription //,
//             // timeStamp = damageEvent.TimeStamp
//         );
//         // check return
//         const returnIdentifier = fexTools.getReturnIdentifier(otherIdentifiers);
//         returnIdentifier && (
//             notify.incrReturn(x.carrierName),
//             notify.incrException(x.carrierName),
//             exceptionStatus = 1,
//             rts = 1,
//             rtsTrackingNo = returnIdentifier.Value,
//             statusDescription = "Package returned to shipper: ".concat(rtsTrackingNo), //carrierStatusMessage
//             returnEvent = fexTools.getReturnEvent(events),
//             timeStamp = returnEvent && returnEvent.Timestamp ? returnEvent.Timestamp : timeStamp,
//             statusCode = returnEvent.StatusExceptionCode
//         );
//         //check exception 71
//         const exception71Event = fexTools.getException71Event(events);
//         exception71Event && (
//             notify.incrException(x.carrierName),
//             statusDescription = exception71Event.StatusExceptionDescription || statusDescription,
//             exceptionStatus = 1,
//             timeStamp = exception71Event.Timestamp
//         );
//         exception71Event && (
//             notify.incrException(x.carrierName)
//         );
//     }
//     if (statusDescription) {
//         if (statusDescription.toLowerCase().includes('delivered')) {
//             notify.incrDelivery(x.carrierName);
//         } else {
//             checkExceptions();
//         }
//     } else {
//         notify.incrException(x.carrierName);
//     }
//     const mTimeStamp = timeStamp ? moment(timeStamp) : null;
//     const mDate = mTimeStamp ? mTimeStamp.format("MMM. DD, YYYY") : '';
//     const mTime = mTimeStamp ? mTimeStamp.format("h:mm A") : '';
//     const fexJson = {
//         status: statusDescription || 'No Status',
//         statusDate: mDate, //from timeStamp
//         statusTime: mTime, //from timestamp

//         estimatedDeliveryDate: trackDetails.estimatedDeliveryDate || '1900-01-01',
//         carrierStatusCode: statusCode || '',
//         carrierStatusMessage: statusDescription || 'No Status',
//         signedForByName: trackDetails.DeliverySignatureName || '',

//         exceptionStatus: exceptionStatus,
//         rts: rts,
//         rtsTrackingNo: rtsTrackingNo,
//         damage: damage,
//         damageMsg: damageMsg,

//         shippingAgentCode: x.carrierName,
//         trackingNumber: x.trackingNumber,
//         rn: x.rn,
//         activityJson: events || null,
//         unifiedStatus: statusCode ? fexStatusCodes[statusCode] || 'noStatus' : 'noStatus'
//     }
//     handler.buffer.next(fexJson);
// }

// function pushUnifiedJson(carrierInfo) {
//     const carrierMap = {
//         fex: (x) => {
//             const unifiedJson = {
//                 name: 'fex'
//                 , trackingNumber: x.trackingNumber
//                 , status: 'delivered'
//                 , dateTime: Date.now()
//             };
//             return (unifiedJson);
//         }
//         , ups: (x) => { }
//         , gso: (x) => { }
//         , tps: (x) => { }
//     }
//     handler.buffer.next(carrierMap[carrierInfo.carrierName](carrierInfo));
// }



// util.xmlToJson = (xml) => {
//     parseString(fedexResponse, { trim: true, explicitArray: false }, function (err, result) {
//         // console.dir(result);
//         const details = result.TrackReply.TrackDetails;
//         result = null;
//         // console.log(details);
//     });
// }

// util.processCarrierSerially = (carrierInfo) => {
//     axios.get(carrierInfo.url)
//         .then(res => {
//             //Save in database

//             config.buffer.next({ trackingNumber: carrierInfo.trackingNumber, name: carrierInfo.name });
//             ibuki.emit('sql1-update:util>db1');
//             // flag && 
//             // config.prepared.next(1);
//             // flag=false;
//             // config.carrierCount--;
//             // config.responseCount++;
//             // console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
//             //     'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
//             //     , ' delay: ', config.piston
//             // );
//         })
//         .catch(err => {
//             //log in database
//             // config.carrierCount--;
//             // config.errorCount++;
//             // console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));
//         });
// }

// handler.sub3 = ibuki.filterOn('parse-api-response:api>util').subscribe(d => {
//     let carrierInfo = d.data;
//     parseString(carrierInfo.response
//         , { trim: true, explicitArray: false }
//         , function (err, result) {
//             if (err) {
//                 ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 3))
//             } else {
//                 const notifications = result.TrackReply.Notifications;
//                 if (notifications.Severity === 'ERROR') {
//                     ibuki.emit('app-error:any', handler.frameError(
//                         { name: 'apiCallError', message: carrierInfo.trackingNumber + ' ' + notifications.LocalizedMessage }
//                         , 'util', 'info', 4))
//                 } else {
//                     //things are fine. Create unified json object and push it to buffer to be updated in database
//                     console.log(carrierInfo.trackingNumber, ' ', result.TrackReply);
//                     carrierInfo.parsedResponse = result.TrackReply;
//                 }
//             }
//             // const details = result.TrackReply.TrackDetails;
//             // console.log(details);
//         });
// });

// util.getCarrierInfos = (name, count) => {
//     let arr = [];
//     for (let i = 0; i < count; i++) {
//         let obj = {
//             trackingNumber: getRandomInt(1000, 10000),
//             url: 'http://localhost:8081/test',
//             name: name
//         }
//         arr.push(obj);
//     }
//     return (arr);
// }

// util.processCarrier = (carrierObject) => {
//     const carrierInfo = carrierObject.carrierInfo;
//     let index = carrierObject.index;
//     axios.get(carrierInfo[index].url)
//         .then(res => {
//             //Save in database
//             console.log(carrierInfo[index].trackingNumber, 'name:', carrierInfo[index].name, ', index: ', index);
//             ibuki.emit('next-carrier:util:workbench', {
//                 carrierInfo: carrierInfo,
//                 index: ++index
//             });
//         })
//         .catch(err => {
//             //log in database
//             console.log('Error processing carrier data', 'index: ', index);
//             ibuki.emit('next-carrier:util:workbench', {
//                 carrierInfo: carrierInfo,
//                 index: ++index
//             });
//         });
// }
// exports.test = "Sushant";
// util.execPromise = (counter) => {
//     axios.get('http://localhost:8081/test')
//         .then(res => {
//             //Save in database
//             console.log(res.data, 'counter: ', counter);
//             ibuki.emit('next-promise');
//         })
//         .catch(err => {
//             //log in database
//             console.log('Error in promise', 'counter: ', counter);
//             ibuki.emit('next-promise');
//         });
// }