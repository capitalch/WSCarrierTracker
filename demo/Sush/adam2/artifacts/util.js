'use strict';
const moment = require('moment');
const ibuki = require('./ibuki');
const handler = require('./handler');
const parseString = require('xml2js').parseString;
const notify = require('./notify');

let util = {};
const tools = {
    unifiedJson: () => {
        return {
            statusDate: '',
            statusTime: '',
            estimatedDeliveryDate: '1900-01-01',
            carrierStatusCode: '',
            carrierStatusMessage: '',
            signedForByName: '',
            exceptionStatus: 0,
            rts: 0,
            rtsTrackingNo: '',
            damage: 0,
            damageMsg: ''
        }
    },
    fex: {
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
        }
    }


}
util.processCarrierResponse = (carrierInfo) => {
    const carriermap = {
        fex: processFex,
        ups: processUps,
        gso: processGso
    }
    carriermap[carrierInfo.carrierName](carrierInfo);
}

function processGso(x) {
    const unifiedJson = {
        name: 'fex',
        trackingNumber: x.trackingNumber,
        status: 'delivered',
        dateTime: Date.now()
    };
    handler.buffer.next(unifiedJson);
}


function processFex(x) {
    parseString(x.response, {
        trim: true,
        explicitArray: false
    }, function (err, result) {
        if (err) {
            ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 3))
        } else {
            const notifications = result.TrackReply.Notifications;
            if ((notifications.Severity === 'ERROR') || (notifications.Severity === 'FAILURE')) {
                ibuki.emit('app-error:any', handler.frameError({
                    name: 'apiCallError',
                    message: 'Fex:' + x.trackingNumber + ' ' + notifications.LocalizedMessage
                }, 'util', 'info', 4))
            } else {
                //things are fine. Create unified json object and push it to buffer to be updated in database
                const trackDetails = result.TrackReply.TrackDetails;
                const statusCode = trackDetails.StatusCode;
                const fexStatusCodes = tools.fex.fexStatusCodes();
                const events = trackDetails.Events;

                let damage = 0,
                    damageMsg = '',
                    exceptionStatus = 0,
                    rts = 0,
                    rtsTrackingNo = '',
                    statusDescription = trackDetails.StatusDescription;

                if (statusDescription) {
                    if (statusDescription.toLowerCase().includes('delivery')) {
                        notify.incrDelivery(x.carrierName);
                    } else {
                        // if(events){
                        const damageEvent = events && Array.isArray(events) && events.find((x) =>
                            x.EventDescription && x.EventDescription.toLowerCase().includes('damage')
                        );
                        damageEvent && (
                            notify.incrDamage++,
                            notify.incrException++,
                            exceptionStatus = 1,
                            damageMsg = damageEvent.EventDescription
                        );
                        // }
                        //
                        //return in other identifier
                        //damage in eventdescription then increase count and exception count
                        // exceptionstatus = 1 if damage or return
                        // 
                    }
                } else {
                    notify.incrException(x.carrierName);
                }

                const timeStamp = tools.fex.timeStamp(events);
                const mTimeStamp = timeStamp ? moment(timeStamp) : null;
                const mDate = mTimeStamp ? mTimeStamp.format("MMM. DD, YYYY") : '';
                const mTime = mTimeStamp ? mTimeStamp.format("h:mm A") : '';
                let unifiedJson = tools.unifiedJson();
                const fexJson = {
                    statusDate: mDate, //from timeStamp
                    statusTime: mTime, //from timestamp

                    estimatedDeliveryDate: trackDetails.estimatedDeliveryDate || unifiedJson.estimatedDeliveryDate,
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
                const final = Object.assign(unifiedJson, fexJson);
                handler.buffer.next(final);
            }
        }
    });
}

function processUps(x) {
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