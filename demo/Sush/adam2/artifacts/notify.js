let verbose = require('../settings.json').config.verbose;
verbose = verbose || true;

let notify = {};
let errors = [];
let progress = {};


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

notify.initCarrier = (carrierName, infos) => {
    progress[carrierName] || (progress[carrierName] = {});
    progress[carrierName].requests || (progress[carrierName].requests = 0);
    progress[carrierName].responses || (progress[carrierName].responses = 0);
    progress[carrierName].queue || (progress[carrierName].queue = 0);
    progress[carrierName].errors || (progress[carrierName].errors = 0);
    progress[carrierName].count = infos.length;
    verbose && (console.log(carrierName, 'Item Count :', progress[carrierName].count));
    return(true);
}

notify.addCarrierRequest = (info) => {
    progress[info.carrierName].requests++;
    progress[info.carrierName].queue = progress[info.carrierName].requests - (progress[info.carrierName].responses) - progress[info.carrierName].errors;
};

notify.addCarrierResponse = (info) => {
    progress[info.carrierName].responses++;
    progress[info.carrierName].queue = (progress[info.carrierName].requests) - progress[info.carrierName].responses - progress[info.carrierName].errors;
    verbose && notify.showProgress(info);
};

notify.addCarrierError = (info) => {
    progress[info.carrierName].errors++;
    progress[info.carrierName].queue = (progress[info.carrierName].requests) - progress[info.carrierName].responses - progress[info.carrierName].errors;
    verbose && notify.showProgress(info);
}

notify.showCarrierStatus = (info) => {
    console.log(
        info.carrierName, ' Requests:', progress[info.carrierName].requests, ' Responses:', progress[info.carrierName].responses, ' Errors:', progress[info.carrierName].errors, ' Queue:', progress[info.carrierName].queue
    );
}

notify.showCarrierStatus = (carrierName) => {
    console.log(carrierName, ' Requests:', progress[carrierName].requests, ' Responses:', progress[carrierName].responses, ' Errors:', progress[carrierName].errors, ' Queue:', progress[carrierName].queue);
}

notify.showProgress = (info) => {
    console.log(info.carrierName, ' Requests:', progress[info.carrierName].requests, ' Responses:', progress[info.carrierName].responses, ' Errors:', progress[info.carrierName].errors, ' Queue:', progress[info.carrierName].queue);
    // Object.keys(progress).forEach(x => {
    //     console.log(x, "->", "Requests:", progress[x].requests, ' Responses:', progress[x].responses, ' Queue:', progress[x].queue);
    // })
}

notify.getProgressInfo = () => {
    return (progress);
}



module.exports = notify;