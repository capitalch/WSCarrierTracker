'use strict';
const moment = require('moment');
const logger = require('./logger');
const settings = require('../settings.json');
const notifyData = require('./notifyData');
// let verbose = settings.config.verbose;
// verbose = verbose || true;

let errors = [];
// const apiStatus = {};
const timing = {};
const dbStatus1 = {
    dbRequests: 0,
    dbResponses: 0,
    dbErrors: 0,
    dbQueue: () => {
        return (dbStatus1.dbRequests - dbStatus1.dbResponses - dbStatus1.dbErrors);
    }
};


const notify = {
    setTime: (t) => {
        timing[t] = moment();
    },
    getTime: (t) => {
        const time = timing[t] ? moment(timing[t]).toISOString() : '0'
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
        notifyData.apiStatus[carrierName].piston = settings.carriers[carrierName].piston || 10;
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
    addDbRequest: (carrierName) => {
        notifyData.dbStatus[carrierName].requests++;
    },
    addDbResponse: (carrierName) => {
        notifyData.dbStatus[carrierName].responses++;
    },
    addDbError: (carrierName) => {
        notifyData.dbStatus[carrierName].errors++;
    },
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
        const allStatus = { apiReq: 0, apiRes: 0, apiErr: 0, apiQue: 0, dbReq: 0, dbRes: 0, dbErr: 0, dbQue: 0 }
        Object.keys(carriers).forEach(x => {
            allStatus.apiReq = allStatus.apiReq + notifyData.apiStatus[x].requests;
            allStatus.apiRes = allStatus.apiRes + notifyData.apiStatus[x].responses;
            allStatus.apiErr = allStatus.apiErr + notifyData.apiStatus[x].errors;
            allStatus.apiQue = allStatus.apiQue + notifyData.apiStatus[x].queue();
            allStatus.dbReq = allStatus.dbReq + notifyData.dbStatus[x].requests;
            allStatus.dbRes = allStatus.dbRes + notifyData.dbStatus[x].responses;
            allStatus.dbErr = allStatus.dbErr + notifyData.dbStatus[x].errors;
            allStatus.dbQue = allStatus.dbQue + notifyData.dbStatus[x].queue();
            notifyData.apiStatus[x] &&
                logger.info(x.concat(' ApiReq:', notifyData.apiStatus[x].requests,
                    ' ApiRes:', notifyData.apiStatus[x].responses,
                    ' ApiErr:', notifyData.apiStatus[x].errors,
                    ' ApiQue:', notifyData.apiStatus[x].queue(),
                    ' Piston:', notifyData.apiStatus[x].piston,
                    ' DbReq:', notifyData.dbStatus[x].requests, ' DbRes:',
                    notifyData.dbStatus[x].responses, ' DbErr:', notifyData.dbStatus[x].errors,
                    ' DbQue:' + notifyData.dbStatus[x].queue()));
        });
        logger.info('Total'.concat(' apiReq:', allStatus.apiReq,
            ' apiRes:', allStatus.apiRes,
            ' apiErr:', allStatus.apiErr,
            ' apiQue:', allStatus.apiQue,
            // ' Total Piston:' + notifyData.apiStatus[x].piston +
            ' dbReq:', allStatus.dbReq,
            ' dbRes:', allStatus.dbRes,
            ' dbErr:', allStatus.dbErr,
            ' dbQue:', allStatus.dbQue,
            ' Time:', moment().toISOString()
        ));
    },
    getJobRunStatus: () => {
        const carriers = Object.keys(notifyData.apiStatus);
        const status = {
            apiReq: 0,
            apiRes: 0,
            apiErr: 0,
            apiQue: 0,
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
            status.dbReq = status.dbReq + notifyData.dbStatus[x].requests;
            status.dbRes = status.dbRes + notifyData.dbStatus[x].responses;
            status.dbErr = status.dbErr + notifyData.dbStatus[x].errors;
            status.dbQue = status.dbQue + notifyData.dbStatus[x].queue();
        });
        return (status);
    },
    pushError: (x) => {
        logger.info(x.message);
    },
    logInfo: (x) => logger.info(x)
}

module.exports = notify;