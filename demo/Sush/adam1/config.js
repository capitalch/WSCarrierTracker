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
config.piston = 20;
config.autoPilotPiston = true;
config.carrierCount = 0;
config.errorCount = 0;
config.requestCount = 0;
config.responseCount = 0;
module.exports = config;