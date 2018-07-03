'use strict';
const ibuki = require('./ibuki');
const domain = require('domain');
const rx = require('rxjs');
const settings = require('../settings.json');
const notify = require('./notify');

const handler = {};
let verbose = settings.config.verbose;
verbose = verbose || true;
handler.buffer = new rx.Subject();
handler.domainError = domain.create();

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
        verbose && notify.showAllStatus();
        isIdle() && (handler.sub6.unsubscribe(), cleanup());
    });
}

function cleanup() {    
    notify.showAllStatus();
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

handler.frameError = (error, location, severity, index) => {
    error.location = location;
    error.severity = severity;
    error.index = index;
    return (error);
}

process.on('exit', function (code) {
    notify.setTime('end');
    console.log('Exiting WSCarrierTracker:', code, ' Start time:', notify.getTime('start'), ' End time:', notify.getTime('end'));
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err.stack || '');
    cleanup();
    process.exit(101);
});

handler.domainError.on('error', function (err) {
    console.log(err.stack || err || '');
    cleanup();
    //use telemetry to log error
    process.exit(102);
});

ibuki.filterOn('app-error:any').subscribe(d => {
    const err = d.data;
    if (err.severity === 'fatal') {
        console.log(err.stack);
        cleanup();
        process.exit(100);
    } else {
        console.log(err);
    }
    // Use telemetry to log error
});

module.exports = handler;