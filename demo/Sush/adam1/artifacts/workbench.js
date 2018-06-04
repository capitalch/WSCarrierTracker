'use strict';
const ibuki = require('./ibuki');
const rx = require('rxjs');
const axios = require('axios');
const _ = require('lodash');
const operators = require('rxjs/operators');
const Q = require('q');
// const fromPromise = require('rxjs/observable/fromPromise');

var workbench = {};

// var promiseFn = function () { return Promise.resolve(42); };
// var pr = Promise.resolve(42);
// var source = rx.from(pr);

ibuki.filterOn('parallel:obs:index:workbench').subscribe(
    d => {
        let obsArray = d.data;
        let fork = rx.forkJoin(obsArray).pipe(operators.catchError(error => {
            let err1 = rx.of(error);
            console.log(err1);
            return (err1);
        }
        ));
        fork.subscribe(d => {
            console.log('Parallel execution completed: ', d);
        }, err => console.log(err));
    }
);

let subs = ibuki.filterOn('parallel:promise:index:workbench').subscribe(
    d => {
        subs.unsubscribe();
        let promiseArray = d.data;
        console.log('length:', promiseArray.length);
        let chunks = _.chunk(promiseArray, 10000);
        console.log('No of chunks:', chunks.length);
        chunks.forEach(a => {
            let f = () => Q.allSettled(a).then(results => {
                results.forEach(result => {
                    console.log(result.value && result.value.data || result.value);
                });
                results = null;
                a = null;
            });
            setTimeout(f, 1000);
        })
        chunks = null;
        promiseArray = null;
    }
)
workbench.getObs = () => {
    const pr = axios.get('http://localhost:8080/test');
    const obs = rx.from(pr);
    return (obs);
};

workbench.getPromise = () => {
    // let ps = axios.get('localhost:8080');
    return (axios.get('http://localhost:8080/test'));
};

module.exports = workbench;
