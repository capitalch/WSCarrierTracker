'use strict';
const ibuki = require('./ibuki');
const rx = require('rxjs');
const operators = require('rxjs/operators');
// const axios = require('axios');
// const _ = require('lodash');
// const operators = require('rxjs/operators');
// const Q = require('q');
const util = require('./util');
var config = require('../config');

var workbench = {};
var counter = 0;
var subject = new rx.Subject();

let sub2 = ibuki.filterOn('serial-process:index:workbench').subscribe(
    d => {
        let carrierInfos = util.getCarrierInfos('Fedex', 1000);
        config.carrierCount = carrierInfos.length;
        rx.from(carrierInfos)
            .pipe(
                operators.concatMap(x => rx.of(x).pipe(operators.delay(config.piston)))
            )
            .subscribe(
                x => {
                    config.requestCount++;
                    util.processCarrierSerially(x);
                }
            );
        ibuki.emit('adjust-piston:self');        
    }
);

let sub0 = ibuki.filterOn('serial-process-delayed:index:workbench').subscribe(
    d => {
        let carrierInfos = util.getCarrierInfos('Fedex', 100);
        config.carrierCount = carrierInfos.length;
        
        rx.interval(config.piston)
            .pipe(
                operators.take(carrierInfos.length),
                operators.map(i => carrierInfos[i])
                // operators.delay(1000)
            )
            .subscribe(
                x => {
                    config.requestCount++;
                    util.processCarrierSerially(x);
                }
            );
        // sub01.unsubscribe();
        // ibuki.emit('adjust-piston:self');
    }
);

let sub1 = ibuki.filterOn('adjust-piston:self').subscribe(
    d => {
        const myInterval = rx.interval(500);
        myInterval.subscribe((x) => {
            const queue = config.requestCount - config.responseCount - config.errorCount;
            if (queue === 0) {
                config.autoPilotPiston && (config.piston = 0);
            }
            else if (queue > 100) {
                config.autoPilotPiston && (config.piston = config.piston + 10);
            } else {
                config.autoPilotPiston && (config.piston = (config.piston > 5) ? (config.piston = config.piston - 5) : (config.piston = config.piston));
            }
            // console.log('Piston adjusted:');
        });
    }
)
module.exports = workbench;

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