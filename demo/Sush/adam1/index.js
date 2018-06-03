const http = require('http');
const ibuki = require('./artifacts/ibuki');
const config = require('./config');
const db = require('./artifacts/db');
const workbench = require('./artifacts/workbench');

ibuki.filterOn('initialize').subscribe(d => {
    console.log(d.data);
    let obsArray = [];
    for (i = 0; i < 100; i++) {
        obsArray[i] = ibuki.get();
    }
    ibuki.emit('parallel:index:workbench', obsArray);
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

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello World!');
}).listen(8080);