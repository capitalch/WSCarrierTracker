const notifyData = {};
// notifyData.exceptions =[];
notifyData.carrierStatus = {
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

notifyData.dbStatus = {
    fex: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.dbStatus.fex;
            const c1 = notifyData.apiStatus.fex
            return (c1.toDb - c.responses - c.errors);
        }
    },
    ups: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.dbStatus.ups;
            const c1 = notifyData.apiStatus.ups;
            return (c1.toDb - c.responses - c.errors);
        }
    },
    gso: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.dbStatus.gso;
            const c1 = notifyData.apiStatus.gso;
            return (c1.toDb - c.responses - c.errors);
        }
    },
    tps: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.dbStatus.tps;
            const c1 = notifyData.apiStatus.tps;
            return (c1.toDb - c.responses - c.errors);
        }
    }
};

notifyData.apiStatus = {
    fex: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.apiStatus.fex;
            return (c.requests - c.responses - c.errors);
        },
        count: 0,
        piston: 0,
        toDb:0,
        statusDrop:0,
        errDrop:0
    },
    ups: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.apiStatus.ups;
            return (c.requests - c.responses - c.errors);
        },
        count: 0,
        piston: 0,
        toDb:0,
        statusDrop:0,
        errDrop:0
    },
    gso: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.apiStatus.gso;
            return (c.requests - c.responses - c.errors);
        },
        count: 0,
        piston: 0,
        toDb:0,
        statusDrop:0,
        errDrop:0
    },
    tps: {
        requests: 0,
        responses: 0,
        errors: 0,
        queue: () => {
            const c = notifyData.apiStatus.tps;
            return (c.requests - c.responses - c.errors);
        },
        count: 0,
        piston: 0,
        toDb:0,
        statusDrop:0,
        errDrop:0
    }
}

module.exports = notifyData;