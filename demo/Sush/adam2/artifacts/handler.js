'use strict';
const ibuki = require('./ibuki');
const domain = require('domain');
const rx = require('rxjs');
const notify = require('./notify');

let handler = {};
handler.buffer = new rx.Subject();
handler.dbRequests = 0;
handler.apiRequests = 0;
handler.carrierCount = 0;

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
    handler.cleanup();
    console.log('Caught exception: ', err.stack);
    process.exit(101);
});

process.on('exit', function (code) {
    console.log('Exiting WSCarrierTracker:', code);
});

const isIdle = () => {
    const apiStatus = notify.getApiStatus();
    const carriers = Object.keys(apiStatus);
    let apiQueue = 0;
    carriers.forEach(x => { apiQueue = apiQueue + apiStatus[x].queue() });
    const dbQueue = notify.getDbStatus().dbQueue();
    const ret = ((dbQueue === 0) && (apiQueue === 0));
    return (ret);
}

handler.closeIfIdle = () => {
    const myInterval = rx.interval(2000);
    handler.sub6 = myInterval.subscribe(() => {
        isIdle() && handler.cleanup();
    });
}

ibuki.filterOn('app-error:any').subscribe(d => {
    const err = d.data;
    if (err.severity === 'fatal') {
        console.log(err.stack);
        handler.cleanup();
        process.exit(100);
    } else {
        console.log(err);
    }
    // Use telemetry to log error
});

handler.frameError = (error, location, severity, index) => {
    error.location = location;
    error.severity=severity;
    error.index=index;
    return (error);
}

handler.cleanup = () => {
    console.log('cleaning up');
    handler.sub0 && handler.sub0.unsubscribe();
    handler.sub1 && handler.sub1.unsubscribe();
    handler.sub2 && handler.sub2.unsubscribe();
    handler.sub3 && handler.sub3.unsubscribe();
    handler.sub4 && handler.sub4.unsubscribe();
    handler.sub5 && handler.sub5.unsubscribe();
    handler.sub6 && handler.sub6.unsubscribe();
    handler.sub7 && handler.sub7.unsubscribe();
    handler.sub8 && handler.sub8.unsubscribe();
    handler.sub9 && handler.sub9.unsubscribe();
    handler.sub10 && handler.sub10.unsubscribe();
    handler.sub11 && handler.sub11.unsubscribe();
    handler.pool && handler.pool.close();
}

module.exports = handler;