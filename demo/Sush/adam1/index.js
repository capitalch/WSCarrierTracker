const http = require('http');
const ibuki = require('./artifacts/ibuki');
const config = require('./config');
const db = require('./artifacts/db');
const workbench = require('./artifacts/workbench');

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    // ibuki.get().subscribe(d => res.end('Hello Random number: ' + d))
    res.end('Hello World!');
}).listen(8080);

ibuki.filterOn('initialize').subscribe(d => {
    console.log(d.data);
    let obsArray = [];
    let promiseArray = [];
    for (i = 0; i < 1; i++) {
        // obsArray[i] = ibuki.get();
        // promiseArray[i] = workbench.get();
    }
    // ibuki.emit('parallel:obs:index:workbench', obsArray);
    let pr = workbench.get();
    pr.then(
        results => {
            console.log(results);
        })
        .catch(err => {
            console.log(err);
        }
        );
    // ibuki.emit('parallel:promise:index:workbench', promiseArray);
    // let x = ibuki.get();
    // x.subscribe(d => {
    //     console.log(d);
    // });
});

ibuki.emit('initialize', {
    a: 1,
    b: 2
});

// ibuki.emit('sql1:index:db');

