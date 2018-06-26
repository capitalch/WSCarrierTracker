'use strict';
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const api = require('./api');
const Q = require('q');

let workbench = {};

handler.sub1 = ibuki.filterOn('handle-big-object:db>workbench').subscribe(
    d => {
        const bigObject = d.data;
        const fedEx = bigObject
            .filter(x =>
                (x.shipping === 'FEX') ||
                (x.shipping === 'FCC')
            ).map(x => {
                x.url = settings.carriers.fedEx.url;
                x.param = `<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>${settings.carriers.fedEx.key}</Key><Password>${settings.carriers.fedEx.password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail><AccountNumber>${settings.carriers.fedEx.accountNumber}</AccountNumber><MeterNumber>${settings.carriers.fedEx.meterNumber}</MeterNumber></ClientDetail><TransactionDetail><CustomerTransactionId>***Track v8 Request using VB.NET***</CustomerTransactionId></TransactionDetail><Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version><PackageIdentifier><Value>${x.trackingNumber}</Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier><IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>`;
                x.method = 'axiosPost';
                x.carrierName = 'fedEx';
                return (x);
            });

        const ups = bigObject
            .filter(x =>
                (x.shipping === 'TMC') ||
                (x.shipping === 'UPS'))
            .map(x => {
                x.url = settings.carriers.ups.url;
                x.param = `<?xml version="1.0"?><AccessRequest xml:lang="en-US"><AccessLicenseNumber>${settings.carriers.ups.accessLicenseNumber}</AccessLicenseNumber><UserId>${settings.carriers.ups.userId}</UserId><Password>${settings.carriers.ups.password}</Password></AccessRequest><?xml version="1.0"?><TrackRequest xml:lang="en-US"><Request><TransactionReference><XpciVersion>1.0001</XpciVersion></TransactionReference><RequestAction>Track</RequestAction><RequestOption>1</RequestOption></Request><TrackingNumber>${x.trackingNumber}</TrackingNumber></TrackRequest>`;
                x.method = 'axiosPost';
                x.carrierName = 'ups';
                return (x);
            });

        const gso = bigObject
            .filter(
                x => (
                    x.shipping === 'GSO'
                ))
            .map(x => {
                // x.url = settings.carriers.gso.url;
                x.method = 'axiosGet';
                x.carrierName = 'gso';
                return (x);
            });
        (gso.length > 0) &&
        (ibuki.emit('pre-process-gso-carrier:self', gso));

        const tps = bigObject
            .filter(x => (
                x.shipping === 'TPS'
            ))
            .map(x => {
                x.url = `${settings.carriers.tps.url}?API=TrackV2&XML=<TrackFieldRequest USERID="${settings.carriers.tps.userId}"><TrackID ID="${x.trackingNumber}"></TrackID></TrackFieldRequest>`;
                x.method = 'axiosGet';
                x.carrierName = 'tps';
                return (x);
            });

        // ibuki.emit('process-carrier:self', fedEx);
        // ibuki.emit('process-carrier:self', ups);
        // ibuki.emit('process-carrier:self',gso);
        // ibuki.emit('process-carrier:self', tps);
        handler.closeIfIdle();
    }
);

handler.sub8 = ibuki.filterOn('process-carrier:self').subscribe(d => {
    const carrierInfos = d.data;
    handler.carrierCount = handler.carrierCount + carrierInfos.length;
    console.log('db requests:', handler.dbRequests, ' carrier count:', handler.carrierCount);
    handler.sub2 = rx.from(carrierInfos)
        .pipe(
            operators
            .concatMap(x => rx.of(x)
                .pipe(operators
                    .delay(settings.carriers[x.carrierName].piston || 20)))
        )
        .subscribe(
            x => {
                api[x.method](x);
                // carrierMap[x.carrierName](x);
                // config.requestCount++;
                // util.processCarrier(x);
                // api.bind axiosPost(x);
            }
        );
});

handler.sub9 = ibuki.filterOn('pre-process-gso-carrier:self').subscribe(d => {
    //get GSO tokens for multiple accounts and store store them in handles.gsoAccounts
    const gso = d.data;
    const gsoConfig = settings.carriers.gso;
    const gsoAccounts = gsoConfig.accounts;
    const tokenPromises = api.getGsoTokenPromises({
        tokenUrl: gsoConfig.tokenUrl,
        accounts: gsoAccounts
    });
    tokenPromises.then(res => {
        // console.log(res);
        // handler.gsoAccountTokens = res.map((x, i) => {
        //     const accountToken = {
        //         accountNumber: gsoAccounts[i].accountNumber,
        //         token: x.state === 'fulfilled' ? x.value.headers.token : null
        //     };
        //     return (accountToken);
        // });
        //ket value pairs. Key is accountNumber and value is token. Error token is null;
        const accountWithTokens = {};
        res.forEach((x, i) => {
            accountWithTokens[gsoAccounts[i].accountNumber] = x.state === 'fulfilled' ?
                x.value.headers.token :
                null;
        })
        gso.forEach(x => {
            x.accountNumber = x.trackingNumber ? x.trackingNumber.substr(0, 5) : null;
            (x.accountNumber === '11111') && (x.accountNumber = '50874');
            x.token = x.accountNumber ? accountWithTokens[x.accountNumber] : '';
            x.url = settings.carriers.gso.url.concat(`TrackingNumber=${x.trackingNumber}&AccountNumber=${x.accountNumber}`)
            x.config = {
                headers: {
                    "Token": x.token,
                    "Content-Type": "application/json"
                }
            };
        });
        ibuki.emit('process-carrier:self', gso);
    }).catch(err => {
        console.log(err);
    });
});

module.exports = workbench;

//deprecated code
// function processCarrier(carrierInfos) {

//     handler.carrierCount = handler.carrierCount + carrierInfos.length;
//     console.log('db requests:', handler.dbRequests, ' carrier count:', handler.carrierCount);
//     handler.sub2 = rx.from(carrierInfos)
//         .pipe(
//             operators
//             .concatMap(x => rx.of(x)
//                 .pipe(operators
//                     .delay(settings.carriers[x.carrierName].piston)))
//         )
//         .subscribe(
//             x => {
//                 api[x.method](x);
//                 // carrierMap[x.carrierName](x);
//                 // config.requestCount++;
//                 // util.processCarrier(x);
//                 // api.bind axiosPost(x);
//             }
//         );
// }
// const carrierMap = {
//     fedEx: (x) => api[x.method](x)
//     // gso: ""
//     , ups: (x) => api[x.method](x)
// }
//${carrierData[i].External}
// const fedExPacket = {
//     url: settings.carriers.fedEx.url,
//     param: `<TrackRequest xmlns='http://fedex.com/ws/track/v3'><WebAuthenticationDetail><UserCredential><Key>${settings.carriers.fedEx.key}</Key><Password>${settings.carriers.fedEx.password}</Password></UserCredential></WebAuthenticationDetail><ClientDetail><AccountNumber>${settings.carriers.fedEx.accountNumber}</AccountNumber><MeterNumber>${settings.carriers.fedEx.meterNumber}</MeterNumber></ClientDetail><TransactionDetail><CustomerTransactionId>***Track v8 Request using VB.NET***</CustomerTransactionId></TransactionDetail><Version><ServiceId>trck</ServiceId><Major>3</Major><Intermediate>0</Intermediate><Minor>0</Minor></Version><PackageIdentifier><Value></Value><Type>TRACKING_NUMBER_OR_DOORTAG</Type></PackageIdentifier><IncludeDetailedScans>1</IncludeDetailedScans></TrackRequest>`,
//     method: ''
// }
// let sub2 = ibuki.filterOn('serial-process:index:workbench').subscribe(
//     d => {
//         let carrierInfos = util.getCarrierInfos('Fedex', 10000);
//         config.carrierCount = carrierInfos.length;
//         rx.from(carrierInfos)
//             .pipe(
//                 operators.concatMap(x => rx.of(x).pipe(operators.delay(config.piston)))
//             )
//             .subscribe(
//                 x => {
//                     config.requestCount++;
//                     util.processCarrierSerially(x);
//                 }
//             );
//         ibuki.emit('adjust-piston:self');
//     }
// );

// let sub0 = ibuki.filterOn('serial-process-delayed:index:workbench').subscribe(
//     d => {
//         let carrierInfos = util.getCarrierInfos('Fedex', 10);
//         config.carrierCount = carrierInfos.length;

//         rx.interval(config.piston)
//             .pipe(
//                 operators.take(carrierInfos.length),
//                 operators.map(i => carrierInfos[i])
//                 // operators.delay(1000)
//             )
//             .subscribe(
//                 x => {
//                     config.requestCount++;
//                     util.processCarrierSerially(x);
//                 }
//             );
//         // sub01.unsubscribe();
//         // ibuki.emit('adjust-piston:self');
//     }
// );

// let sub1 = ibuki.filterOn('adjust-piston:self').subscribe(
//     d => {
//         const myInterval = rx.interval(500);
//         myInterval.subscribe((x) => {
//             const queue = config.requestCount - config.responseCount - config.errorCount;
//             if (queue === 0) {
//                 config.autoPilotPiston && (config.piston = 0);
//             } else if (queue > 100) {
//                 config.autoPilotPiston && (config.piston = config.piston + 10);
//             } else {
//                 config.autoPilotPiston && (config.piston = (config.piston > 5) ? (config.piston = config.piston - 5) : (config.piston = config.piston));
//             }
//             // console.log('Piston adjusted:');
//         });
//     }
// )

// console.log('started');
// rx.from(carrierInfos)
//     .pipe(
//         operators.delay(2000),
//         // operators.take(carrierInfos.length),
//         // operators.map(i => carrierInfos[i]),
//         operators.repeat()
//     )
//     .subscribe(
//         x => {
//             config.requestCount++;
//             console.log(x);
//             // util.processCarrierSerially(x);
//         }
//     );

// rx.from('a')
//     .pipe(
//         operators.map(i => rx.interval(100))
//         , operators.map(j => rx.interval(500))
//         , operators.switchMap(j => rx.interval(2000))
//         // , operators.switchAll()
//     ).pipe(
//         operators.take(carrierInfos.length),
//         operators.map(i => carrierInfos[i])
//     )
//     .subscribe(
//         x => {
//             console.log(x);
//         }
//     )
// rx.from(carrierInfos).subscribe(
//     x => {
//         console.log(x);
//     }
// )
// let sub1 = ibuki.filterOn('serial-process:index:workbench').subscribe(
//     d => {
//         let carrierInfos = util.getCarrierInfos('Fedex', 10000);
//         config.carrierCount = carrierInfos.length;
//         carrierInfos.forEach(
//             x => {
//                 setTimeout(() => {
//                     util.processCarrierSerially(x);
//                 }, 2000);
//             }
//         )
//     }
// )

// let sub2 = ibuki.filterOn('next-carrier:util:workbench').subscribe(
//     d => {
//         const carrierObject = d.data;
//         const carrierInfo = carrierObject.carrierInfo;
//         const index = carrierObject.index;
//         if (index < carrierInfo.length) {
//             util.processCarrier({
//                 carrierInfo: carrierInfo,
//                 index: index
//             })
//         }
//     }
// )

// let sub3 = ibuki.filterOn('start-processing-carrier:index:workbench').subscribe(
//     d => {
//         let carrierInfo = util.getCarrierInfos('Fedex', 50000);
//         ibuki.emit('next-carrier:util:workbench', {
//             carrierInfo: carrierInfo,
//             index: 0
//         });

//         carrierInfo = util.getCarrierInfos('DHL', 200);
//         ibuki.emit('next-carrier:util:workbench', {
//             carrierInfo: carrierInfo,
//             index: 0
//         });

//         carrierInfo = util.getCarrierInfos('ABhl', 15000);
//         ibuki.emit('next-carrier:util:workbench', {
//             carrierInfo: carrierInfo,
//             index: 0
//         });

//         carrierInfo = util.getCarrierInfos('Robaco', 5000);
//         ibuki.emit('next-carrier:util:workbench', {
//             carrierInfo: carrierInfo,
//             index: 0
//         });
//     }
// );

// let sub0 = ibuki.filterOn('next-promise').subscribe(
//     d => {
//         (counter <= config.promiseCounter) && util.execPromise(counter);
//         counter++;
//     }
// )

// let sub1 = ibuki.filterOn('test-seq-promises-start:index:workbench').subscribe(
//     d => {
//         // 
//         if (counter <= config.promiseCounter) {
//             ibuki.emit('next-promise')
//         }
//         sub1.unsubscribe();
//     }
// );
// let sub2 = ibuki.filterOn('parallel:obs:index:workbench').subscribe(
//     d => {
//         sub3.unsubscribe();
//         let obsArray = d.data;
//         let fork = rx.forkJoin(obsArray).pipe(operators.catchError(error => {
//             let err1 = rx.of(error);
//             console.log(err1);
//             return (err1);
//         }));
//         fork.subscribe(d => {
//             console.log('Parallel execution completed: ', d);
//         }, err => console.log(err));
//     }
// );

// let sub3 = ibuki.filterOn('test-promise:index:workbench').subscribe(
//     d => {
//         sub5.unsubscribe();
//         console.log('Promise execution started...');
//         let promiseArray = d.data;
//         Q.allSettled(promiseArray).then(
//             (results) => {
//                 console.log(results);
//             }, (rejects) => {
//                 console.log(rejects);
//             }
//         ).catch(e => {
//             console.log('Q Catch error');
//         });
//     }
// )

// workbench.getPromise = () => {
//     return (axios.get('http://localhost:8081/test'));
// };

// workbench.getObs = () => {
//     const pr = axios.get('http://localhost:8080/test');
//     const obs = rx.from(pr);
//     return (obs);
// };

/*

// let sub4 = ibuki.filterOn('parallel:promise:index:workbench').subscribe(
//     d => {
//         sub4.unsubscribe();
//         let promiseArray = d.data;
//         console.log('length:', promiseArray.length);

//         let chunks = _.chunk(promiseArray, 10);
//         let c1 = chunks[0],
//             c2 = chunks[1],
//             c3 = chunks[2],
//             c4 = chunks[3];
//         Q.allSettled(c1)
//             .then((r2) => {
//                 console.log(r2);
//                 Q.allSettled(c2)
//             })
//             .then((r3) => {
//                 console.log(r3);
//                 Q.allSettled(c3)
//             })
//             .then((r4) => {
//                 console.log(r4);
//                 Q.allSettled(c4)
//             })
//             .then(r => console.log(r1));
//     }
// )
// Q.allSettled(promiseArray).then((results) => {
        //     // results.forEach(result => {
        //     //     console.log(result.value && result.value.data || result.value);
        //     // });
        //     console.log(results);
        // }).catch(e => {
        //     console.log(e);
        // });
// .then(Q.allSettled(c3))
        // .then(Q.allSettled(c4))
        // .then(r=>console.log(r))
        
        // Q.allSettled(chunks[0])
        //     .then(Q.allSettled(chunks[1]).then(r => console.log(r))).then(
        //         results => console.log(results)
        //     );
        // console.log('No of chunks:', chunks.length);
        // chunks.forEach(a => {
        //     let f = () => Q.allSettled(a).then(results => {
        //         results.forEach(result => {
        //             console.log(result.value && result.value.data || result.value);
        //         });
        //         results = null;
        //         a = null;
        //     });
        //     setTimeout(f, 1000);
        // })
        // chunks = null;
        // promiseArray = null;
// let resolves = (r) => {
        //     console.log(r);
        // };
        // let rejects = (e) => {
        //     console.log(e);
        // };
        // let pr1 = axios.get('http://localhost:8080/test')
        //     .then(resolves, rejects).catch(e => console.log(e));

        // Q.allSettled(pr1).then(
        //     (resolves) => { 
        //         console.log(resolves); 
        //     }
        //     , (rejects) => { 
        //         console.log(rejects); 
        //     }
        // ).catch(e => {
        //     console.log('Q catch error');
        // });
*/