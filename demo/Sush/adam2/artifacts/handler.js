'use strict';
const ibuki = require('./ibuki');
const domain = require('domain');
const rx = require('rxjs');
let handler = {};
//process is global variable. Let the domain error ride over process variable
// so that it is available everywhere. Domain error is unhandled error anywhere in application
process.domainError = domain.create();
process.domainError.on('error', function (err) {
    // error.severity = 'fatal';
    handler.cleanup();
    console.log(err);
    //use telemetry to log error
    process.exit(100);
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

process.on('exit', function (code) {
    console.log('Exiting WSCarrierTracker:', code);
});

ibuki.filterOn('app-error:any').subscribe(d => {
    const err = d.data;
    if (err.severity === 'fatal') {
        console.log(err);
        handler.cleanup();
        process.exit(100);
    }
    // Use telemetry to log error
});

handler.frameError = (err, location, severity, index) => {
    err.location = location;
    err.severity = severity;
    err.index = index;
    return (err);
}
handler.cleanup = () => {
    console.log('cleaning up');
    handler.sub1 && handler.sub1.unsubscribe();
    handler.pool && handler.pool.close();
}

module.exports = handler;