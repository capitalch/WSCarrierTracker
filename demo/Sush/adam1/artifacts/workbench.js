const ibuki = require('./ibuki');
const rx = require('rxjs');
const axios = require('axios');
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
        rx.forkJoin(obsArray).subscribe(d => {
            console.log('Parallel execution completed: ', d);
        })
    }
);

ibuki.filterOn('parallel:promise:index:workbench').subscribe(
    d => {
        let promiseArray = d.data;
        Q.allSettled(promiseArray).then(results => {
            results.forEach(result => {
                console.log(result.value);
            })
        })
    }
)

workbench.get = () => {
    let ps = axios.get('localhost:8080');
    return (axios.get('http://localhost:8080'));
};

module.exports = workbench;
