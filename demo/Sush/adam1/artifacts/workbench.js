'use strict';
const ibuki = require('./ibuki');
const rx = require('rxjs');
const axios = require('axios');
const _ = require('lodash');
const operators = require('rxjs/operators');
const Q = require('q');
const util = require('./util');
var config = require('../config');

var workbench = {};
var counter = 0;
let sub1 = ibuki.filterOn('test-seq-promises-start:index:workbench').subscribe(
    d => {
        // 
        if (counter <= config.promiseCounter) {
            ibuki.emit('next-promise')
        }
        sub1.unsubscribe();
    }
);

let sub2 = ibuki.filterOn('next-promise').subscribe(
    d => {
        // 
        util.execPromise(counter);
        counter++;
        // sub2.unsubscribe();
    }
)


let sub3 = ibuki.filterOn('parallel:obs:index:workbench').subscribe(
    d => {
        sub3.unsubscribe();
        let obsArray = d.data;
        let fork = rx.forkJoin(obsArray).pipe(operators.catchError(error => {
            let err1 = rx.of(error);
            console.log(err1);
            return (err1);
        }));
        fork.subscribe(d => {
            console.log('Parallel execution completed: ', d);
        }, err => console.log(err));
    }
);

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

let sub5 = ibuki.filterOn('test-promise:index:workbench').subscribe(
    d => {
        sub5.unsubscribe();
        console.log('Promise execution started...');
        let promiseArray = d.data;
        Q.allSettled(promiseArray).then(
            (results) => {
                console.log(results);
            }, (rejects) => {
                console.log(rejects);
            }
        ).catch(e => {
            console.log('Q Catch error');
        });
    }
)

workbench.getObs = () => {
    const pr = axios.get('http://localhost:8080/test');
    const obs = rx.from(pr);
    return (obs);
};

workbench.getPromise = () => {
    return (axios.get('http://localhost:8081/test'));
};

module.exports = workbench;

/*
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