const rx = require('rxjs');
const operators = require('rxjs/operators');
var config = {};
config.dbConfig = {
    user: 'sagarwal',
    password: 'su$hant123',
    server: 'wineshipping.database.windows.net',
    database: 'WSCarrierTracker',
    options: {
        encrypt: true // Use this if you're on Windows Azure
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
}
// config.promiseCounter = 10;
config.piston = 10;
config.autoPilotPiston = true;
config.carrierCount = 0;
config.errorCount = 0;
config.requestCount = 0;
config.responseCount = 0;

config.buffer = new rx.Subject();
config.prepared = new rx.Subject();
// config.zip = rx.pipe(operators.zip(config.buffer, config.prepared, (v1, v2) => v1));
config.zip = rx.zip(config.buffer, config.prepared, (v1, v2) => v1);
module.exports = config;