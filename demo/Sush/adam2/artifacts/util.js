'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const handler = require('./handler');
const config = require('./config');
const parseString = require('xml2js').parseString;

let util = {};

util.processCarrierResponse = (carrierInfo) => {

    const carriermap = {
        fedEx: processFedEx
        , ups: processUps
    }

    carriermap[carrierInfo.carrierName](carrierInfo);
}

function processFedEx(xml) {
    parseString(x.response
        , { trim: true, explicitArray: false }
        , function (err, result) {
            if (err) {
                ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 3))
            } else {
                const notifications = result.TrackReply.Notifications;
                if (notifications.Severity === 'ERROR') {
                    ibuki.emit('app-error:any', handler.frameError(
                        { name: 'apiCallError', message: x.trackingNumber + ' ' + notifications.LocalizedMessage }
                        , 'util', 'info', 4))
                } else {
                    //things are fine. Create unified json object and push it to buffer to be updated in database
                    const unifiedJson = {
                        name: 'fedEx'
                        , trackingNumber: x.trackingNumber
                        , status: 'delivered'
                        , dateTime: Date.now()
                    };
                    handler.buffer.next(unifiedJson);
                    // carrierInfo.parsedResponse = result.TrackReply;
                    // pushUnifiedJson(carrierInfo);
                }
            }
        });
};

function processUps(x) {
    parseString(x.response
        , { trim: true, explicitArray: false }
        , function (err, result) {
            if (err) {
                ibuki.emit('app-error:any', handler.frameError(err, 'util', 'info', 5))
            } else {
                const response = result.TrackResponse.Response;
                if (response.ResponseStatusCode === '0') {
                    const errorDescription = response.Error.ErrorDescription
                    ibuki.emit('app-error:any', handler.frameError(
                        { name: 'apiCallError', message: x.trackingNumber + ' ' + errorDescription }
                        , 'util', 'info', 4))
                } else {
                    const unifiedJson = {
                        name: 'fedEx'
                        , trackingNumber: x.trackingNumber
                        , status: 'delivered'
                        , dateTime: Date.now()
                    };
                    handler.buffer.next(unifiedJson);
                    // carrierInfo.parsedResponse = response;
                }
            }
        }
    )
}

// function pushUnifiedJson(carrierInfo) {
//     const carrierMap = {
//         fedEx: (x) => {
//             const unifiedJson = {
//                 name: 'fedEx'
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


module.exports = util;

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