'use strict';
const path = require('path');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const express = require('express');

const app = express();

const argv = require('minimist')(process.argv.slice(2));

//random generator
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandom() {
    const rnd = getRandomInt(0, 1000);
    return (rx.of(rnd).pipe(operators.delay(rnd)));
}

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', ' GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

var __publicFolder = __dirname + '/dist';
app.use(express.static(__publicFolder));

app.get('/test', function (req, res) {
    res.end('Hello Random number: ' + getRandomInt(1,100000));
    // getRandom().subscribe(d => {
    //     console.log(d);
        
    //     if (d <= 300) {
    //         res.status(400).send('Bad Request');
    //     } else {
    //         res.end('Hello Random number: ' + d);
    //     }
    // });
});

// Running the server 
// app.listen(argv.p, _ => console.log('Running on port ' +  argv.p));
app.listen(8081, _ => console.log('Running on port ' + 8081));