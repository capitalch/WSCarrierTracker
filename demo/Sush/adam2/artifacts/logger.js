'use strict';
const winston = require('winston');
const moment = require('moment');
const settings = require('../settings');

const notProduction = !(settings.config && settings.config.production);
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

let transports = [new winston.transports.File(options.file)];
(notProduction) && transports.push(new winston.transports.Console(options.console));

const logger = winston.createLogger({
    transports: transports
});

module.exports = logger;

//deprecated
// [
//     new winston.transports.Console(options.console),
//     new winston.transports.File(options.file)
// ]