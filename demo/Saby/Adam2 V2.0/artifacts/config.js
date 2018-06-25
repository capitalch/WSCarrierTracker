//const rx = require('rxjs');
//const operators = require('rxjs/operators');
let config = {};
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
    // user: 'sagarwal',
    // password: 'su$hant123',
    // server: 'wineshipping.database.windows.net',
    // database: 'WSCarrierTracker',
    // options: {
    //     encrypt: true // Use this if you're on Windows Azure
    // },
    // pool: {
    //     max: 10,
    //     min: 0,
    //     idleTimeoutMillis: 30000
    // }
};
config.piston = 10;
module.exports = config;