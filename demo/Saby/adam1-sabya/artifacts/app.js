'use strict';
const path = require('path');
const express = require('express');
const ibuki = require('./ibuki');
const config = require('../config');
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

config.carrierCount = 0;
config.errorCount = 0;
config.requestCount = 0;
config.responseCount = 0;
app.get('/status', function (req, res) {
    let status = {
        piston: config.piston
        , "Carrier Count": config.carrierCount
        , "Total requests": config.requestCount
        , "Total responses": config.responseCount
        , "Errors": config.errorCount
        , "In Queue": config.requestCount - config.responseCount - config.errorCount
    };
    res.json(status);
});

// Running the server 
// app.listen(argv.p, _ => console.log('Running on port ' +  argv.p));
app.listen(8080, _ => console.log('Running on port ' + 8080));


// API
// app.get('/', function (req, res) {
//     res.sendFile(path.join(__publicFolder + '/index.html'));
// });

// app.get('/*', (req, res) => {
//     res.end('hello smoke test');
// })