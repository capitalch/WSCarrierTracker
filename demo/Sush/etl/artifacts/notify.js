'use strict';
const moment = require('moment');
const _ = require('lodash');
const logger = require('./logger');
const settings = require('../settings.json');
const notifyData = require('./notifyData');

const timing = {};
const apiQueueArray = new Array(10).fill(0);

const notify = {
    getDatetimeFormat: () => {
        const f = _.has(settings, 'config.logDatetimeFormat') ? settings.config.logDatetimeFormat : 'YYYY-MM-DD HH:mm:SS'
        return (f);
    },
    setTime: (t) => {
        timing[t] = moment();
    },
    getTime: (t) => {
        const time = timing[t] ? moment(timing[t]).format(notify.getDatetimeFormat()) : '0'
        return (time);
    },
    getJobRunDuration: () => {
        let duration = '0';
        if (timing.start && timing.end) {
            const diff = timing.end.diff(timing.start);
            duration = moment.utc(diff).format('HH:mm:ss');
        }
        return (duration);
    },
    getDbStatus: () => notifyData.dbStatus,
     getApiStatus: () => notifyData.apiStatus,
    getPiston: (carrierName) => notifyData.apiStatus[carrierName].piston,
    varyPiston: (carrierName, variation) => {
        let temp = notifyData.apiStatus[carrierName].piston + variation;
        (temp < 0) && (variation = 0);
        notifyData.apiStatus[carrierName].piston = notifyData.apiStatus[carrierName].piston + variation;
    },
    getApiQueue: (carrierName) => notifyData.apiStatus[carrierName].queue(),
    addApiRequest: (info) => {
        notifyData.apiStatus[info.carrierName].requests++;
    },
    addApiResponse: (info) => {
        notifyData.apiStatus[info.carrierName].responses++;
    },
    addApiError: (info) => {
        notifyData.apiStatus[info.carrierName].errors++;
        // verbose && notify.showStatus(info);
    },
    getApiError: (info) => notifyData.apiStatus[info.carrierName].errors,
    addApiToDb: (carrierName) => {
        notifyData.apiStatus[carrierName].toDb++;
    },
    addApiStatusDrop: (info) => {
        notifyData.apiStatus[info.carrierName].statusDrop++;
    },
    addApiErrDrop: (info) => {
        notifyData.apiStatus[info.carrierName].errDrop++;
    },
    addDbRequest: (carrierName) => {
        notifyData.dbStatus[carrierName].requests++;
    },
    addDbResponse: (carrierName) => {
        notifyData.dbStatus[carrierName].responses++;
    },
    addDbError: (carrierName) => {
        notifyData.dbStatus[carrierName].errors++;
    },
    getDbErrors: (carrierName) => notifyData.dbStatus[carrierName].errors,
    showAllStatus: () => {
        const carriers = settings.carriers;
        const allStatus = {
            toDb: 0,
            dbReq: 0,
            dbRes: 0,
            dbErr: 0,
            dbQue: 0
        }
        Object.keys(carriers).forEach(x => {
            allStatus.statusDrop = allStatus.statusDrop + notifyData.apiStatus[x].statusDrop;
            allStatus.errDrop = allStatus.errDrop + notifyData.apiStatus[x].errDrop;
            allStatus.toDb = allStatus.toDb + notifyData.apiStatus[x].toDb;
            allStatus.dbReq = allStatus.dbReq + notifyData.dbStatus[x].requests;
            allStatus.dbRes = allStatus.dbRes + notifyData.dbStatus[x].responses;
            allStatus.dbErr = allStatus.dbErr + notifyData.dbStatus[x].errors;
            allStatus.dbQue = allStatus.dbQue + notifyData.dbStatus[x].queue();
            const s = x.concat(
                ' toDb:', notifyData.apiStatus[x].toDb,
                ' dbReq:', notifyData.dbStatus[x].requests, ' dbRes:',
                notifyData.dbStatus[x].responses, ' dbErr:', notifyData.dbStatus[x].errors,
                ' dbQue:' + notifyData.dbStatus[x].queue());
            notifyData.apiStatus[x] &&
                logger.info(s);
        });
        const s1 = 'Total'.concat(
            ' toDb:', allStatus.toDb,
            ' dbReq:', allStatus.dbReq,
            ' dbRes:', allStatus.dbRes,
            ' dbErr:', allStatus.dbErr,
            ' dbQue:', allStatus.dbQue,
            ' t:', moment().format(notify.getDatetimeFormat())
        );
        logger.info(s1);
    },
    getJobRunStatus: () => {
        const carriers = Object.keys(notifyData.apiStatus);
        const status = {
            toDb: 0,
            dbReq: 0,
            dbRes: 0,
            dbErr: 0,
            dbQue: 0,
            startTime: notify.getTime('start'),
            endTime: notify.getTime('end'),
            duration: notify.getJobRunDuration()
        };
        carriers && carriers.forEach(x => {
            status.dbReq = status.dbReq + notifyData.dbStatus[x].requests;
            status.dbRes = status.dbRes + notifyData.dbStatus[x].responses;
            status.dbErr = status.dbErr + notifyData.dbStatus[x].errors;
            status.dbQue = status.dbQue + notifyData.dbStatus[x].queue();
        });
        return (status);
    },
    isSameApiQueueRepeat10: () => {
        const apiQue = notify.getJobRunStatus().apiQue;
        apiQueueArray.push(apiQue);
        apiQueueArray.shift();
        const isSame = apiQueueArray.every(x => x === apiQue);
        return (isSame);
    },
    pushError: (x) => {
        x && logger.info(x.message);
    },
    logInfo: (x) => logger.info(x)
}

module.exports = notify;