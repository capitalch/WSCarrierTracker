'use strict';
const settings = require('../settings.json');
let verbose = settings.config.verbose;
verbose = verbose || true;

let errors = [];
const apiStatus = {};
const dbStatus = {
    dbRequests: 0,
    dbResponses: 0,
    dbErrors: 0,
    dbQueue: () => {
        return (dbStatus.dbRequests - dbStatus.dbResponses - dbStatus.dbErrors);
    }
};
const notify = {
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
        verbose && notify.showStatus(info);
    },
    addApiError: (info) => {
        apiStatus[info.carrierName].errors++;
        verbose && notify.showStatus(info);
    },
    showStatus: (info) => {
        console.log(info.carrierName,
            ' ApiRequests:', apiStatus[info.carrierName].requests, ' ApiResponses:', apiStatus[info.carrierName].responses, ' ApiErrors:', apiStatus[info.carrierName].errors, ' ApiQueue:', apiStatus[info.carrierName].queue(), ' Piston:', apiStatus[info.carrierName].piston, ' DbRequests:', dbStatus.dbRequests, ' DbResponses:', dbStatus.dbResponses, ' DbErrors:', dbStatus.dbErrors, ' DbQueue:', dbStatus.dbQueue()
        );
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