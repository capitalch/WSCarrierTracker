'use strict';
const axios = require('axios');
const ibuki = require('./ibuki');
const config = require('../config');
const xml2js = require('xml2js');

let util = {};
let parser  = new xml2js.Parser();
util.processCarrierSerially = (carrierInfo) => {
    carrierInfo.method == 'axiosGetWithHeader' && util.axiosGetWithHeader(carrierInfo);
    carrierInfo.method == 'post' && util.axiosPost(carrierInfo);
    carrierInfo.method == 'axiosGet' && util.axiosGet(carrierInfo);

    // axios.get(carrierInfo.url)
    //     .then(res => {
    //         //Save in database
    //         config.carrierCount--;
    //         config.responseCount++;
    //         console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
    //             'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
    //             , ' delay: ', config.piston
    //         );

    //         // ibuki.emit('next-carrier:util:workbench', {
    //         //     carrierInfo: carrierInfo,
    //         //     index: ++index
    //         // });
    //     })
    //     .catch(err => {
    //         //log in database
    //         config.carrierCount--;
    //         config.errorCount++;
    //         console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));

    //         // ibuki.emit('next-carrier:util:workbench', {
    //         //     carrierInfo: carrierInfo,
    //         //     index: ++index
    //         // });
    //     });
}


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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

util.getRandomDelay = () => {
    const rnd = getRandomInt(0, 100);
    return (rx.of(rnd).pipe(operators.delay(rnd)));
}

util.getCarrierInfos = (carrierData, count) => {
    let arr = [];
    for (let i = 0; i < count; i++) {
        let obj = {};
        switch (carrierData[i].Shipping) {
            case ("FEX"):
            case ("FCC"):
                obj = {
                    trackingNumber: carrierData[i].External,
                    url: 'https://gateway.fedex.com:443/xml',
                    name: carrierData[i].Shipping,
                    method: 'post',
                    rn: carrierData[i].rn,
                    param: `<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>JfSbK7tkzfRBMf8G</Key><Password>dbc2GzV8LXPIcc7BQ4NPTMdUE</Password></UserCredential></WebAuthenticationDetail><ClientDetail><AccountNumber>510087348</AccountNumber><MeterNumber>5690072</MeterNumber></ClientDetail><TransactionDetail><CustomerTransactionId>***Track v8 Request using VB.NET***</CustomerTransactionId></TransactionDetail><Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version><PackageIdentifier><Value>${carrierData[i].External}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier><IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>`
                }
                arr.push(obj);
                break;
            case ("TMC"):
            case ("UPS"):
                obj = {
                    trackingNumber: carrierData[i].External,
                    url: 'https://onlinetools.ups.com/ups.app/xml/Track',
                    name: carrierData[i].Shipping,
                    method: 'post',
                    rn: carrierData[i].rn,
                    param: `<?xml version="1.0"?><AccessRequest xml:lang="en-US"><AccessLicenseNumber>FC312F9BE62AFF90</AccessLicenseNumber><UserId>UPSwineshipping</UserId><Password>easyship</Password></AccessRequest><?xml version="1.0"?><TrackRequest xml:lang="en-US"><Request><TransactionReference><XpciVersion>1.0001</XpciVersion></TransactionReference><RequestAction>Track</RequestAction><RequestOption>1</RequestOption></Request><TrackingNumber>${carrierData[i].External}</TrackingNumber></TrackRequest>`
                }
                arr.push(obj);
                break;
            case ("GSO"):
                obj = {
                    trackingNumber: carrierData[i].External,
                    url: `https://api.gso.com/Rest/v1/TrackShipment?TrackingNumber=${carrierData[i].External}&AccountNumber=50874`,
                    name: carrierData[i].Shipping,
                    method: 'axiosGetWithHeader',
                    rn: carrierData[i].rn,
                    token: 'YX5dIhnUYm4xSwgFj28RsUJDfVn/PmEEOhbNmg7DWJMZk5ljunL5DWkgrBDsdLFt/rUCdi96l41cUucadd/GlYGmHDSIE/jOZ5vr9GbslrQ='
                }
                arr.push(obj);
                break;
            case ("TPS"):
                obj = {
                    trackingNumber: carrierData[i].External,
                    url: `http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=<TrackFieldRequest USERID="487WINES7756"><TrackID ID="${carrierData[i].External}"></TrackID></TrackFieldRequest>`,
                    name: carrierData[i].Shipping,
                    rn: carrierData[i].rn,
                    method: 'axiosGet',
                    param: ''
                }
                arr.push(obj);
                break;
        }
    }
    // for (let i = 0; i < count; i++) {
    //     let obj = {
    //         trackingNumber: getRandomInt(1000, 10000),
    //         url: 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=%3CTrackFieldRequest%20USERID=%22487WINES7756%22%3E%3CTrackID%20ID=%229400110200829650000000%22%3E%3C/TrackID%3E%3C/TrackFieldRequest%3E',
    //         name: name
    //     }
    //     arr.push(obj);
    // }
    return (arr);
}

util.axiosGet = (carrierInfo) => {
    axios.get(carrierInfo.url)
        .then(res => {
           
            parser.parseString(res.data, function (err, result) {
                console.dir(result);
            });
            //Save in database
            config.carrierCount--;
            config.responseCount++;
            console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
                'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
                , ' delay: ', config.piston, ' dbCount: ',( config.dbRequestCount-config.dbResponseCount) 
            );
            ibuki.emit('sql2:util:db', {
                status: res.status,
                rn: carrierInfo.rn
            })

            // ibuki.emit('next-carrier:util:workbench', {
            //     carrierInfo: carrierInfo,
            //     index: ++index
            // });
        })
        .catch(err => {
            //log in database
            config.carrierCount--;
            config.errorCount++;
            console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));

            // ibuki.emit('next-carrier:util:workbench', {
            //     carrierInfo: carrierInfo,
            //     index: ++index
            // });
        });
}
util.axiosPost = (carrierInfo) => {
    axios.post(carrierInfo.url, carrierInfo.param)
        .then(res => {
            //Save in database
            config.carrierCount--;
            config.responseCount++;            
            parser.parseString(res.data, function (err, result) {
                console.dir(result);
            });
            console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
                'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
                , ' delay: ', config.piston, ' dbCount: ',( config.dbRequestCount-config.dbResponseCount)
            );
            ibuki.emit('sql2:util:db', {
                status: res.status,
                rn: carrierInfo.rn
            })

            // ibuki.emit('next-carrier:util:workbench', {
            //     carrierInfo: carrierInfo,
            //     index: ++index
            // });
        })
        .catch(err => {
            //log in database
            config.carrierCount--;
            config.errorCount++;
            console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));

            // ibuki.emit('next-carrier:util:workbench', {
            //     carrierInfo: carrierInfo,
            //     index: ++index
            // });
        });

}


util.axiosGetWithHeader = (carrierInfo) => {

    axios.get(carrierInfo.url, { headers: { Token: carrierInfo.token, 'Content-Type': 'application/json' } })
        .then(res => {
            //Save in database
            parser.parseString(res.data, function (err, result) {
                console.dir(result);
            });
            config.carrierCount--;
            config.responseCount++;
            console.log(carrierInfo.trackingNumber, 'name:', carrierInfo.name,
                'Count: ', config.carrierCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount)
                , ' delay: ', config.piston, ' dbCount: ',( config.dbRequestCount-config.dbResponseCount)
            );
            ibuki.emit('sql2:util:db', {
                status: res.status,
                rn: carrierInfo.rn
            })

            // ibuki.emit('next-carrier:util:workbench', {
            //     carrierInfo: carrierInfo,
            //     index: ++index
            // });
        })
        .catch(err => {
            //log in database
            config.carrierCount--;
            config.errorCount++;
            console.log('Error:', 'Count:', config.carrierCount, 'Error:', config.errorCount, 'Queued:', (config.requestCount - config.responseCount - config.errorCount));

            // ibuki.emit('next-carrier:util:workbench', {
            //     carrierInfo: carrierInfo,
            //     index: ++index
            // });
        });

}

module.exports = util;
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