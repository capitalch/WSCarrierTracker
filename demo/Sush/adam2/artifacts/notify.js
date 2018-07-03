'use strict';
const settings = require('../settings.json');
let verbose = settings.config.verbose;
verbose = verbose || true;

let errors = [];
const apiStatus = {};
const timing = {};
const dbStatus = {
    dbRequests: 0,
    dbResponses: 0,
    dbErrors: 0,
    dbQueue: () => {
        return (dbStatus.dbRequests - dbStatus.dbResponses - dbStatus.dbErrors);
    }
};

const carrierStatus = {
    fex: {
        delivered: 0,
        return: 0,
        damage: 0,
        exception: 0,
        notDelivered: 0
    },
    ups: {
        delivered: 0,
        return: 0,
        damage: 0,
        exception: 0,
        notDelivered: 0
    },
    gso: {
        delivered: 0,
        return: 0,
        damage: 0,
        exception: 0,
        notDelivered: 0
    },
    tps: {
        delivered: 0,
        return: 0,
        damage: 0,
        exception: 0,
        notDelivered: 0
    }
};

const notify = {
    setTime: (t) => {
        timing[t] = (new Date()).toISOString();
    },
    getTime: (t) => {
        return (timing[t]);
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
    getDbStatus: () => dbStatus,
    getApiStatus: () => apiStatus,
    initCarrier: (carrierName, infos) => {
        apiStatus[carrierName] || (apiStatus[carrierName] = {});
        apiStatus[carrierName].requests || (apiStatus[carrierName].requests = 0);
        apiStatus[carrierName].responses || (apiStatus[carrierName].responses = 0);
        apiStatus[carrierName].queue || (apiStatus[carrierName].queue = () =>
            apiStatus[carrierName].requests - apiStatus[carrierName].responses - apiStatus[carrierName].errors);
        apiStatus[carrierName].errors || (apiStatus[carrierName].errors = 0);
        apiStatus[carrierName].count = infos.length;
        apiStatus[carrierName].piston = settings.carriers[carrierName].piston || 10;
        verbose && (console.log(carrierName, 'Item Count :', apiStatus[carrierName].count));
        return (true);
    },
    getPiston: (carrierName) => apiStatus[carrierName].piston,
    varyPiston: (carrierName, variation) => {
        let temp = apiStatus[carrierName].piston + variation;
        (temp < 0) && (variation = 0);
        apiStatus[carrierName].piston = apiStatus[carrierName].piston + variation;
    },
    getQueue: (carrierName) => apiStatus[carrierName].queue(),
    addDbRequest: () => {
        dbStatus.dbRequests++;
    },
    addDbResponse: () => {
        dbStatus.dbResponses++;
    },
    addDbError: () => {
        dbStatus.dbErrors++;
    },
    addApiRequest: (info) => {
        apiStatus[info.carrierName].requests++;
    },
    addApiResponse: (info) => {
        apiStatus[info.carrierName].responses++;
        // verbose && notify.showStatus(info);
    },
    addApiError: (info) => {
        apiStatus[info.carrierName].errors++;
        // verbose && notify.showStatus(info);
    },
    incrDelivered: (carrierName) => {
        carrierStatus[carrierName].delivered++;
    },
    incrDamage: (carrierName) => {
        carrierStatus[carrierName].damage++;
    },
    incrReturn: (carrierName) => {
        carrierStatus[carrierName].return++;
    },
    incrException: (carrierName) => {
        carrierStatus[carrierName].exception++;
    },
    incrNotDelivered: (carrierName) => {
        carrierStatus[carrierName].notDelivered++;
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
            apiStatus[x] && console.log(x, ' ApiRequests:', apiStatus[x].requests,
                ' ApiResponses:', apiStatus[x].responses,
                ' ApiErrors:', apiStatus[x].errors,
                ' ApiQueue:', apiStatus[x].queue(),
                ' Piston:', apiStatus[x].piston,
                ' DbRequests:', dbStatus.dbRequests, ' DbResponses:',
                dbStatus.dbResponses, ' DbErrors:', dbStatus.dbErrors,
                ' DbQueue:', dbStatus.dbQueue());
        });
    },
    pushError: (x) => {
        verbose && console.log(x);
        errors.push(x)
    },
    getAllErrors: () => notify.errors,
    showAllErrors: () => {
        errors.forEach((x) => {
            console.log(x);
        })
    }
}

module.exports = notify;