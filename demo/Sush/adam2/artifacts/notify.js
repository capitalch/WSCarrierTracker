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

        // apiStatus[carrierName] || (apiStatus[carrierName] = {});
        // apiStatus[carrierName].requests || (apiStatus[carrierName].requests = 0);
        // apiStatus[carrierName].responses || (apiStatus[carrierName].responses = 0);
        // apiStatus[carrierName].queue || (apiStatus[carrierName].queue = () =>
        //     apiStatus[carrierName].requests - apiStatus[carrierName].responses - apiStatus[carrierName].errors);
        // apiStatus[carrierName].errors || (apiStatus[carrierName].errors = 0);
        notifyData.apiStatus[carrierName].count = infos.length;
        notifyData.apiStatus[carrierName].piston = settings.carriers[carrierName].piston || 10;
        logger.info(carrierName + 'Item Count: ' + notifyData.apiStatus[carrierName].count);
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
    addDbRequest: (carrierName) => {
        notifyData.dbStatus[carrierName].requests++;
    },
    addDbResponse: (carrierName) => {
        notifyData.dbStatus[carrierName].responses++;
    },
    addDbError: (carrierName) => {
        notifyData.dbStatus[carrierName].errors++;
    },
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
    // showStatus: (info) => {
    //     console.log(info.carrierName,
    //         ' ApiRequests:', apiStatus[info.carrierName].requests,
    //         ' ApiResponses:', apiStatus[info.carrierName].responses,
    //         ' ApiErrors:', apiStatus[info.carrierName].errors,
    //         ' ApiQueue:', apiStatus[info.carrierName].queue(),
    //         ' Piston:', apiStatus[info.carrierName].piston,
    //         ' DbRequests:', dbStatus.dbRequests, ' DbResponses:',
    //         dbStatus.dbResponses, ' DbErrors:', dbStatus.dbErrors,
    //         ' DbQueue:', dbStatus.dbQueue());
    // },
    showAllStatus: () => {
        const carriers = settings.carriers;
        Object.keys(carriers).forEach(x => {
            notifyData.apiStatus[x] &&
                // console.log(x, ' ApiRequests:', apiStatus[x].requests,
                //     ' ApiResponses:', apiStatus[x].responses,
                //     ' ApiErrors:', apiStatus[x].errors,
                //     ' ApiQueue:', apiStatus[x].queue(),
                //     ' Piston:', apiStatus[x].piston,
                //     ' DbRequests:', dbStatus.dbRequests, ' DbResponses:',
                //     dbStatus.dbResponses, ' DbErrors:', dbStatus.dbErrors,
                //     ' DbQueue:', dbStatus.dbQueue());
                logger.info(x + ' ApiRequests:' + notifyData.apiStatus[x].requests +
                    ' ApiResponses:' + notifyData.apiStatus[x].responses +
                    ' ApiErrors:' + notifyData.apiStatus[x].errors +
                    ' ApiQueue:' + notifyData.apiStatus[x].queue() +
                    ' Piston:' + notifyData.apiStatus[x].piston +
                    ' DbRequests:' + notifyData.dbStatus[x].requests + ' DbResponses:' +
                    notifyData.dbStatus[x].responses + ' DbErrors:' + notifyData.dbStatus[x].errors +
                    ' DbQueue:' + notifyData.dbStatus[x].queue())
        });
    },
    getJobRunStatus: () => {
        const carriers = Object.keys(notifyData.apiStatus);
        const status = {
            apiRequests: 0,
            apiResponses: 0,
            apiErrors: 0,
            dbRequests: 0,
            dbResponses: 0,
            dbErrors: 0,
            startTime: notify.getTime('start'),
            endTime: notify.getTime('end'),
            duration: notify.getJobRunDuration()
        };
        carriers && carriers.forEach(x => {
            status.apiRequests = status.apiRequests + notifyData.apiStatus[x].requests;
            status.apiResponses = status.apiResponses + notifyData.apiStatus[x].responses;
            status.apiErrors = status.apiErrors + notifyData.apiStatus[x].errors;

            status.dbRequests = status.dbRequests + notifyData.dbStatus[x].requests;
            status.dbResponses = status.dbResponses + notifyData.dbStatus[x].responses;
            status.dbErrors = status.dbErrors + notifyData.dbStatus[x].errors;

        });
        // status.dbRequests = dbStatus1.dbRequests;
        // status.dbResponses = dbStatus1.dbResponses;
        // status.errors = dbStatus1.dbErrors;
        return (status);
    },
    pushError: (x) => {
        logger.info(x.message);
    },
    logInfo: (x) => logger.info(x)
}

module.exports = notify;