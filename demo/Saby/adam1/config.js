var config = {};
config.dbConfig = {
    user: 'nwuser',
    password: 'user123%',
    server: 'nwazdb01.database.windows.net',
    database: 'PackageTracker',
    options: {
        encrypt: true // Use this if you're on Windows Azure
    },
    pool: {
        max: 100,
        min: 0,
        idleTimeoutMillis: 300000
    }
}
// config.promiseCounter = 10;
config.piston = 50;
config.autoPilotPiston = true;
config.carrierCount = 0;
config.errorCount = 0;
config.requestCount = 0;
config.dbRequestCount=0;
config.dbResponseCount=0;
config.responseCount = 0;
module.exports = config;