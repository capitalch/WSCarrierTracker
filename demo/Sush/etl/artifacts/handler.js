'use strict';
const _ = require('lodash');
const moment = require('moment');
const domain = require('domain');
const rx = require('rxjs');
const ibuki = require('./ibuki');
const settings = require('../settings.json');
const notify = require('./notify');

const handler = {};
const subArray = [];
handler.buffer = new rx.Subject();
handler.domainError = domain.create();
const samplingRate = _.has(settings, 'config.samplingRateSec') ? settings.config.samplingRateSec * 1000 : 5000

const isIdle = () => {
    const apiStatus = notify.getApiStatus();
    let carriers = Object.keys(apiStatus);
    let apiQueue = 0;
    let toDb = 0;
    carriers.forEach(x => {
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
}

// handler.handleCarrierError = (err, x) => {
//     notify.pushError(err);
//     notify.incrException(x.carrierName);
//     const errorJson = notify.getErrorJson(err, x);
//     if (notify.isSameStatus(x, errorJson)) {
//         notify.addApiStatusDrop(x);
//     } else {
//         handler.buffer.next(errorJson);
//     }
// }

handler.closeIfIdle = () => {
    const myInterval = rx.interval(samplingRate);
    handler.sub6 = myInterval.subscribe(() => {
        notify.showAllStatus();
        isIdle() && (
            notify.setTime('end'),
            handler.sub6.unsubscribe(),
            cleanup(0)
        )
    });
}

function cleanup(code) {
    notify.logInfo(notify.getJobRunStatus());
    notify.logInfo('cleaning up');
    subArray.forEach(x => x.unsubscribe());
    handler.pool && handler.pool.close();
    setTimeout(() => {
        process.exit(code); // wait until logger is flushed
    }, 3000);
}

process.on('exit', function (code) {
    notify.logInfo('Exiting program: exit code: ' +
        code +
        ' Start time:' +
        notify.getTime('start') +
        ' End time:' +
        notify.getTime('end') +
        ' Duration (hh:mm:ss) ' +
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
    if (err.severity && (err.severity === 'fatal')) {
        notify.logInfo(err.stack);
        cleanup(100);
    }
    // Use telemetry to log error
});
handler.beforeCleanup(handler.sub14);

const subs2 = ibuki.filterOn('kill-process:any>handler').subscribe(
    (d) => {
        notify.setTime('end');
        notify.logInfo('Killing the process at:'.concat(moment().format(notify.getDatetimeFormat())));
        subs2.unsubscribe();
        cleanup(d.data || 103);
    }
)

module.exports = handler;
