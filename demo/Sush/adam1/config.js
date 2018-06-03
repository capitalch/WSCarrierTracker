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

module.exports = config;