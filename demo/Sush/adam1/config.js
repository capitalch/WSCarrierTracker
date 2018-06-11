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
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000, 
        evictionRunIntervalMillis: 5, 
        softIdleTimeoutMillis: 5 
    }
}
// config.promiseCounter = 10;
config.piston = 10;
config.autoPilotPiston = true;
config.carrierCount = 0;
config.errorCount = 0;
config.requestCount = 0;
config.responseCount = 0;
module.exports = config;