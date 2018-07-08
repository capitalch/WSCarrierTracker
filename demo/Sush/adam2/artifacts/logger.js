'use strict';
const winston = require('winston');
const moment = require('moment');

const options = {
    file: {
        level: 'info',
        // filename: './logs/app.log',
        filename: './logs/' + moment().format('YYYY-MM-DD HH-mm-ss') + '.log',
        handleExceptions: true,
        json: true,
        //   maxsize: 5242880, // 5MB
        // maxsize: 5120,
        // maxFiles: 5,
        colorize: false
    },
    console: {
        level: 'info',
        handleExceptions: true,
        json: false,
        colorize: true
    }
};
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(options.console),
        new winston.transports.File(options.file)
    ]
});

module.exports = logger;
// logger.info('Hello again distributed logs');