'use strict';
const moment = require('moment');
const _ = require('lodash');
const logger = require('./logger');
const settings = require('../settings.json');
const notifyData = require('./notifyData');
// const verbose = _.has(settings, 'config.verbose') ? settings.config.verbose : true;

const timing = {};
const apiQueueArray = new Array(10).fill(0);

const notify = {
    getDatetimeFormat: () => {
        const f = _.has(settings, 'config.logDatetimeFormat') ? settings.config.logDatetimeFormat : 'YYYY-MM-DD HH:mm:SS'
        return (f);
    },
    isSameStatus: (c1, c2) => {
        let ret = false;
        ret = (c1.trackingNumber === c2.trackingNumber) &&
            (c1.status === c2.status) &&
            (c1.statusDate === c2.statusDate) &&
            (c1.statusTime === c2.statusTime) &&
            (moment(c1.estimatedDeliveryDate).format('YYYY-MM-DD') === c2.estimatedDeliveryDate) &&
            (c1.carrierStatusCode === c2.carrierStatusCode) &&
            (c1.carrierStatusMessage === c2.carrierStatusMessage) &&
            (c1.signedForByName === c2.signedForByName) &&
            (c1.exceptionStatus === c2.exceptionStatus) &&
            (c1.rts === c2.rts) &&
            (c1.rtsTrackingNo === c2.rtsTrackingNo) &&
            (c1.damage === c2.damage) &&
            (c1.damageMsg === c2.damageMsg)
        return (ret);
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
    getErrorJson: (error, info) => {
        const errorJson = {
            status: 'No Status',
            statusDate: '',
            statusTime: '',
            estimatedDeliveryDate: '1900-01-01',
            carrierStatusCode: '',
            carrierStatusMessage: error.message,
            signedForByName: '',
            exceptionStatus: 1,
            rts: 0,
            rtsTrackingNo: '',
            damage: 0,
            damageMsg: '',

            shippingAgentCode: info.carrierName,
            trackingNumber: info.trackingNumber,
            rn: info.rn,
            activityJson: null,
            unifiedStatus: 'noStatus'
        }
        return (errorJson);
    },
    getDbStatus: () => notifyData.dbStatus,
    getApiStatus: () => notifyData.apiStatus,
    getCarrierStatus: () => notifyData.carrierStatus,
    initCarrier: (carrierName, infos) => {
        notifyData.apiStatus[carrierName].count = infos.length;
        const prop = 'carriers.'.concat(carrierName, '.pistonMillis');
        notifyData.apiStatus[carrierName].piston = _.has(settings, prop) ? settings.carriers[carrierName].pistonMillis || 10 : 10;
        logger.info(carrierName + ' Item Count: ' + notifyData.apiStatus[carrierName].count);
        // verbose && (console.log(carrierName, 'Item Count :', apiStatus[carrierName].count));
        return (true);
    },
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
        // verbose && notify.showStatus(info);
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
    incrDelivered: (carrierName) => {
        notifyData.carrierStatus[carrierName].delivered++;
    },
    incrDamage: (carrierName) => {
        notifyData.carrierStatus[carrierName].damage++;
    },
    incrReturn: (carrierName) => {
        notifyData.carrierStatus[carrierName].return++;
    },
    incrException: (carrierName) => {
        notifyData.carrierStatus[carrierName].exception++;
    },
    incrNotDelivered: (carrierName) => {
        notifyData.carrierStatus[carrierName].notDelivered++;
    },
    showAllStatus: () => {
        const carriers = settings.carriers;
        const allStatus = {
            apiReq: 0,
            apiRes: 0,
            apiErr: 0,
            apiQue: 0,
            statusDrop: 0,
            errDrop: 0,
            toDb: 0,
            dbReq: 0,
            dbRes: 0,
            dbErr: 0,
            dbQue: 0
        }
        Object.keys(carriers).forEach(x => {
            allStatus.apiReq = allStatus.apiReq + notifyData.apiStatus[x].requests;
            allStatus.apiRes = allStatus.apiRes + notifyData.apiStatus[x].responses;
            allStatus.apiErr = allStatus.apiErr + notifyData.apiStatus[x].errors;
            allStatus.apiQue = allStatus.apiQue + notifyData.apiStatus[x].queue();
            allStatus.statusDrop = allStatus.statusDrop + notifyData.apiStatus[x].statusDrop;
            allStatus.errDrop = allStatus.errDrop + notifyData.apiStatus[x].errDrop;
            allStatus.toDb = allStatus.toDb + notifyData.apiStatus[x].toDb;
            allStatus.dbReq = allStatus.dbReq + notifyData.dbStatus[x].requests;
            allStatus.dbRes = allStatus.dbRes + notifyData.dbStatus[x].responses;
            allStatus.dbErr = allStatus.dbErr + notifyData.dbStatus[x].errors;
            allStatus.dbQue = allStatus.dbQue + notifyData.dbStatus[x].queue();
            const s = x.concat(' apiReq:', notifyData.apiStatus[x].requests,
                ' apiRes:', notifyData.apiStatus[x].responses,
                ' apiErr:', notifyData.apiStatus[x].errors,
                ' apiQue:', notifyData.apiStatus[x].queue(),
                ' piston:', notifyData.apiStatus[x].piston,
                ' statusDrop:', notifyData.apiStatus[x].statusDrop,
                ' errDrop:', notifyData.apiStatus[x].errDrop,
                ' toDb:', notifyData.apiStatus[x].toDb,
                ' dbReq:', notifyData.dbStatus[x].requests, ' dbRes:',
                notifyData.dbStatus[x].responses, ' dbErr:', notifyData.dbStatus[x].errors,
                ' dbQue:' + notifyData.dbStatus[x].queue());
            notifyData.apiStatus[x] &&
                logger.info(s);
                // console.log(s);
        });
        const s1 = 'Total'.concat(' apiReq:', allStatus.apiReq,
            ' apiRes:', allStatus.apiRes,
            ' apiErr:', allStatus.apiErr,
            ' apiQue:', allStatus.apiQue,
            // ' Total Piston:' + notifyData.apiStatus[x].piston +
            ' statusDrop:', allStatus.statusDrop,
            ' errDrop:', allStatus.errDrop,
            ' toDb:', allStatus.toDb,
            ' dbReq:', allStatus.dbReq,
            ' dbRes:', allStatus.dbRes,
            ' dbErr:', allStatus.dbErr,
            ' dbQue:', allStatus.dbQue,
            ' t:', moment().format(notify.getDatetimeFormat())
        );
        logger.info(s1);
        // console.log(s1);
    },
    getJobRunStatus: () => {
        const carriers = Object.keys(notifyData.apiStatus);
        const status = {
            apiReq: 0,
            apiRes: 0,
            apiErr: 0,
            apiQue: 0,
            statusDrop: 0,
            errDrop: 0,
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
            status.apiReq = status.apiReq + notifyData.apiStatus[x].requests;
            status.apiRes = status.apiRes + notifyData.apiStatus[x].responses;
            status.apiErr = status.apiErr + notifyData.apiStatus[x].errors;
            status.apiQue = status.apiQue + notifyData.apiStatus[x].queue();
            status.statusDrop = status.statusDrop + notifyData.apiStatus[x].statusDrop;
            status.errDrop = status.errDrop + notifyData.apiStatus[x].errDrop;
            status.toDb = status.toDb + notifyData.apiStatus[x].toDb;
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
        // x && console.log(x.message);
    },
    logInfo: (x) => logger.info(x)
}

module.exports = notify;