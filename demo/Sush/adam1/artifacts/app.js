'use strict';
const path = require('path');
const express = require('express');
const ibuki = require('./ibuki');

const app = express();

const argv = require('minimist')(process.argv.slice(2));

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', ' GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

var __publicFolder = __dirname + '/dist';
app.use(express.static(__publicFolder));

// API
// app.get('/', function (req, res) {
//     res.sendFile(path.join(__publicFolder + '/index.html'));
// });

// app.get('/*', (req, res) => {
//     res.end('hello smoke test');
// })

app.get('/test', function (req, res) {
    // res.writeHead(200, {
    //     'Content-Type': 'text/plain'
    // });
    ibuki.get().subscribe(d => {
        if (d <= 7000) {
            res.status(400).send('Bad Request');
        } else {
            res.end('Hello Random number: ' + d);
        }
        // res.status(400).send('Bad Request');
        // res.end('Hello Random number: ' + d);
    });
    // res.end('hello smoke test');
});

// Running the server 
// app.listen(argv.p, _ => console.log('Running on port ' +  argv.p));
app.listen(8080, _ => console.log('Running on port ' + 8080));