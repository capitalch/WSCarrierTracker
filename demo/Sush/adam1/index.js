const http = require('http');
const ibuki = require('./artifacts/ibuki');
const config = require('./config');
const db = require('./artifacts/db');
const workbench = require('./artifacts/workbench');
const app = require('./artifacts/app');

// http.createServer(function (req, res) {
//     res.writeHead(200, {
//         'Content-Type': 'text/plain'
//     });
//     // ibuki.get().subscribe(d => res.end('Hello Random number: ' + d))
//     res.end('Hello World!');
// }).listen(8080);

ibuki.filterOn('initialize').subscribe(d => {
    // console.log(d.data);
    let obsArray = [];
    let promiseArray = [];
    for (i = 0; i < 100000; i++) {
        // obsArray[i] = workbench.getObs();
        promiseArray[i] = workbench.getPromise();
    };
    // let x = workbench.getPromise();
    // ibuki.emit('parallel:obs:index:workbench', obsArray);
    // ibuki.emit('parallel:promise:index:workbench', promiseArray);
    ibuki.emit('test-promise:index:workbench', promiseArray);
});

ibuki.emit('initialize', {
    a: 1,
    b: 2
});

// ibuki.emit('sql1:index:db');

