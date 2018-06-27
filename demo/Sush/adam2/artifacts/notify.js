'use strict';
const settings = require('../settings.json');
let verbose = settings.config.verbose;
verbose = verbose || true;

let notify = {};
let errors = [];
const apiStatus = {};
const dbStatus = {
    dbRequests: 0, dbResponses: 0, dbErrors: 0
    , dbQueue: () => {
        return (dbStatus.dbRequests - dbStatus.dbResponses - dbStatus.dbErrors);
    }
};

notify.getDbStatus = () => dbStatus;
notify.getApiStatus = () => apiStatus;


notify.initCarrier = (carrierName, infos) => {
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
}

notify.getPiston = (carrierName) => apiStatus[carrierName].piston;
notify.setPiston = (carrierName, piston) => { apiStatus[carrierName].piston = piston; }
notify.getQueue = (carrierName) => apiStatus[carrierName].queue();
notify.varyPiston = (carrierName, variation) => {
    let temp = apiStatus[carrierName].piston + variation;
     (temp < 0) && (variation = 0);
    apiStatus[carrierName].piston = apiStatus[carrierName].piston + variation;

};

notify.addDbRequest = () => {
    dbStatus.dbRequests++;
    // notify.dbStatus.queue = notify.dbStatus.dbRequests - notify.dbStatus.dbResponses - notify.dbStatus.errors;
}

notify.addDbResponse = () => {
    dbStatus.dbResponses++;
    // notify.dbStatus.queue = notify.dbStatus.dbRequests - notify.dbStatus.dbResponses - notify.dbStatus.errors;
}

notify.addDbError = () => {
    dbStatus.dbErrors++;
}

notify.addApiRequest = (info) => {
    apiStatus[info.carrierName].requests++;
    // apiStatus[info.carrierName].queue = apiStatus[info.carrierName].requests - (apiStatus[info.carrierName].responses) - apiStatus[info.carrierName].errors;
};

notify.addApiResponse = (info) => {
    apiStatus[info.carrierName].responses++;
    // apiStatus[info.carrierName].queue = (apiStatus[info.carrierName].requests) - apiStatus[info.carrierName].responses - apiStatus[info.carrierName].errors;
    verbose && notify.showApiStatus(info);
};

notify.addApiError = (info) => {
    apiStatus[info.carrierName].errors++;
    // apiStatus[info.carrierName].queue = (apiStatus[info.carrierName].requests) - apiStatus[info.carrierName].responses - apiStatus[info.carrierName].errors;
    verbose && notify.showApiStatus(info);
}
notify.pushError = (x) => {
    verbose && console.log(x);
    errors.push(x)
};

notify.getAllErrors = () => notify.errors;

notify.showAllErrors = () => {
    errors.forEach((x) => {
        console.log(x);
    });
};

notify.showApiStatus = (info) => {
    console.log(info.carrierName,
        ' ApiRequests:'
        , apiStatus[info.carrierName].requests
        , ' ApiResponses:'
        , apiStatus[info.carrierName].responses
        , ' ApiErrors:'
        , apiStatus[info.carrierName].errors
        , ' ApiQueue:'
        , apiStatus[info.carrierName].queue()
        , ' Piston:'
        , apiStatus[info.carrierName].piston
        , ' DbRequests:'
        , dbStatus.dbRequests
        , ' DbResponses:'
        , dbStatus.dbResponses
        , ' DbErrors:'
        , dbStatus.dbErrors
        , ' DbQueue:'
        , dbStatus.dbQueue()
    );

    // notify.getapiQueue = (carrierName)=>{

    // }

    // notify.showCarrierStatus = (info) => {
    //     console.log(
    //         info.carrierName, ' Requests:', apiStatus[info.carrierName].requests, ' Responses:', apiStatus[info.carrierName].responses, ' Errors:', apiStatus[info.carrierName].errors, ' Queue:', apiStatus[info.carrierName].queue
    //     );
    // }

    // notify.showCarrierStatus = (carrierName) => {
    //     console.log(carrierName, ' Requests:', apiStatus[carrierName].requests, ' Responses:', apiStatus[carrierName].responses, ' Errors:', apiStatus[carrierName].errors, ' Queue:', apiStatus[carrierName].queue);
    // }



    // Object.keys(apiStatus).forEach(x => {
    //     console.log(x, "->", "Requests:", apiStatus[x].requests, ' Responses:', apiStatus[x].responses, ' Queue:', apiStatus[x].queue);
    // })
}

notify.getapiStatusInfo = () => {
    return (apiStatus);
}



module.exports = notify;