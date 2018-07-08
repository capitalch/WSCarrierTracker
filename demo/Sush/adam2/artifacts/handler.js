'use strict';
const _ = require('lodash');
const domain = require('domain');
const rx = require('rxjs');
const ibuki = require('./ibuki');
const settings = require('../settings.json');
const notify = require('./notify');
const email = require('./email');

const handler = {};
let verbose = settings.config.verbose;
verbose = verbose || true;
handler.buffer = new rx.Subject();
handler.domainError = domain.create();
const samplingrate = _.has(settings,'config.samplingRateInSec') ? settings.config.samplingRateInSec * 1000 : 5000
const isIdle = () => {
    const apiStatus = notify.getApiStatus();
    let carriers = Object.keys(apiStatus);
    let apiQueue = 0;
    let toDb = 0;
    carriers.forEach(x => {
        apiQueue = apiQueue + apiStatus[x].queue();
        toDb = toDb + apiStatus[x].toDb;
    });
    let dbQueue = 0;
    const dbStatus = notify.getDbStatus();
    let dbRequests = 0;
    carriers = Object.keys(dbStatus);
    carriers.forEach(x=>{
        dbQueue = dbQueue + dbStatus[x].queue();
        dbRequests = dbRequests + dbStatus[x].requests;
    });
    const ret = ((dbQueue === 0) && (apiQueue === 0) && (toDb === dbRequests));
    return (ret);
}

handler.closeIfIdle = () => {
    const myInterval = rx.interval(samplingrate);
    handler.sub6 = myInterval.subscribe(() => {
        verbose && notify.showAllStatus();
        isIdle() && (
            notify.setTime('end'), ibuki.emit('db-log:handler>db'), handler.sub6.unsubscribe()
        );
    });
}

const subs = ibuki.filterOn('cleanup:db>handler').subscribe(() => {
    subs.unsubscribe();
    ibuki.emit('send-status-mail:handler>email');
    // cleanup(0);
});

const subs1 = ibuki.filterOn('mail-processed:email>handler').subscribe(() => {
    subs1.unsubscribe();
    cleanup(0);
    // process.exit(0);
});

function cleanup(code) {
    // notify.showAllStatus();
    notify.logInfo(notify.getJobRunStatus());
    notify.logInfo('cleaning up');
    // console.log(notify.getJobRunStatus());
    // console.log('cleaning up');
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
    handler.sub12 && handler.sub12.unsubscribe();
    handler.sub13 && handler.sub13.unsubscribe();
    handler.sub14 && handler.sub14.unsubscribe();
    handler.sub15 && handler.sub15.unsubscribe();
    handler.sub16 && handler.sub16.unsubscribe();
    handler.pool && handler.pool.close();
    process.exit(code);
}

handler.frameError = (error, location, severity, index) => {
    error.location = location;
    error.severity = severity;
    error.index = index;
    return (error);
}

process.on('exit', function (code) {
    // console.log('Exiting program:Exit code:', code, ' Start time:', notify.getTime('start'), ' End time:', notify.getTime('end'), ' Duration (hh:mm:ss)', notify.getJobRunDuration());
    notify.logInfo('Exiting program:Exit code:' +
        code +
        ' Start time:' +
        notify.getTime('start') +
        ' End time:' +
        notify.getTime('end') +
        ' Duration (hh:mm:ss)' +
        notify.getJobRunDuration()
    );
    // notify.showAllErrors();
});

process.on('uncaughtException', function (err) {
    // console.log('Uncaught exception:', err.stack || '');
    notify.logInfo('Uncaught exception: ' + err.stack || '');
    cleanup(101);
});

handler.domainError.on('error', function (err) {
    // console.log('Domain exception:', err.stack || err || '');
    notify.logInfo('Domain exception: ' + err.stack || err || '');
    cleanup(102);
    //use telemetry to log error
});

handler.sub14 = ibuki.filterOn('app-error:any').subscribe(d => {
    const err = d.data;
    if (err.severity === 'fatal') {
        notify.logInfo(err.stack);
        cleanup(100);
    }
    // Use telemetry to log error
});

module.exports = handler;