'use strict';
const _ = require('lodash');
const moment = require('moment');
const domain = require('domain');
const rx = require('rxjs');
const ibuki = require('./ibuki');
const settings = require('../settings.json');
const notify = require('./notify');
const email = require('./email');

const handler = {};
const subArray = [];
let verbose = settings.config.verbose;
verbose = verbose || true;
handler.buffer = new rx.Subject();
handler.domainError = domain.create();
const samplingRate = _.has(settings, 'config.samplingRateSec') ? settings.config.samplingRateSec * 1000 : 5000
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
    carriers.forEach(x => {
        dbQueue = dbQueue + dbStatus[x].queue();
        dbRequests = dbRequests + dbStatus[x].requests;
    });
    const ret = ((
        (dbQueue === 0) && (toDb === dbRequests)) &&
        ((apiQueue === 0) || notify.isSameApiQueueRepeat10())); // To trap final apiQue not zero
    return (ret);
}

handler.beforeCleanup = (x) => {
    x && subArray.push(x);
    // x && handler.sub0 && handler.sub0.add(x);
}

handler.closeIfIdle = () => {
    const myInterval = rx.interval(samplingRate);
    handler.sub6 = myInterval.subscribe(() => {
        verbose && notify.showAllStatus();
        isIdle() && (
            notify.setTime('end'),
            ibuki.emit('db-log:handler>db'),
            handler.sub6.unsubscribe()
        )
    });
}

const subs = ibuki.filterOn('cleanup:db>handler').subscribe(() => {
    subs.unsubscribe();
    ibuki.emit('send-status-mail:handler>email');
});

const subs1 = ibuki.filterOn('mail-processed:email>handler').subscribe(() => {
    subs1.unsubscribe();
    cleanup(0);
});

function cleanup(code) {
    notify.logInfo(notify.getJobRunStatus());
    notify.logInfo('cleaning up');
    subArray.forEach(x=>x.unsubscribe());
    // unsubscribe();
    handler.pool && handler.pool.close();
    process.exit(code);
}

function unsubscribe() {
    // handler.sub0 && handler.sub0.unsubscribe();
    // handler.sub1 && handler.sub1.unsubscribe();
    // handler.sub2 && handler.sub2.unsubscribe();
    // handler.sub3 && handler.sub3.unsubscribe();
    // handler.sub4 && handler.sub4.unsubscribe();
    // handler.sub5 && handler.sub5.unsubscribe();
    // handler.sub6 && handler.sub6.unsubscribe();
    // handler.sub7 && handler.sub7.unsubscribe();
    // handler.sub8 && handler.sub8.unsubscribe();
    // handler.sub9 && handler.sub9.unsubscribe();
    // handler.sub10 && handler.sub10.unsubscribe();
    // handler.sub11 && handler.sub11.unsubscribe();
    // handler.sub12 && handler.sub12.unsubscribe();
    // handler.sub13 && handler.sub13.unsubscribe();
    // handler.sub14 && handler.sub14.unsubscribe();
    // handler.sub15 && handler.sub15.unsubscribe();
    // handler.sub16 && handler.sub16.unsubscribe();
    // handler.sub17 && handler.sub17.unsubscribe();
    // handler.sub18 && handler.sub18.unsubscribe();
    unsubscribe1();
}

function unsubscribe1() {
    // handler.sub19 && handler.sub19.unsubscribe();
    // handler.sub19 && handler.sub19.unsubscribe();
}

handler.frameError = (error, location, severity, index) => {
    error.location = location;
    error.severity = severity;
    error.index = index;
    return (error);
}

process.on('exit', function (code) {
    notify.logInfo('Exiting program:Exit code:' +
        code +
        ' Start time:' +
        notify.getTime('start') +
        ' End time:' +
        notify.getTime('end') +
        ' Duration (hh:mm:ss)' +
        notify.getJobRunDuration()
    );
});

process.on('uncaughtException', function (err) {
    notify.logInfo('Uncaught exception: ' + err.stack || '');
    cleanup(101);
});

handler.domainError.on('error', function (err) {
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
handler.beforeCleanup(handler.sub14);

const subs2 = ibuki.filterOn('kill-process:any>handler').subscribe(
    (d) => {
        // const s = moment().format(notify.getDatetimeFormat());
        notify.setTime('end');
        notify.logInfo('Killing the process at:'.concat(moment().format(notify.getDatetimeFormat())));
        subs2.unsubscribe();
        cleanup(d.data || 103);
    }
)

module.exports = handler;