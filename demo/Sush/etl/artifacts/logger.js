'use strict';
const winston = require('winston');
const moment = require('moment');
const settings = require('../settings');

const notProduction = !(settings.config && settings.config.production);
const options = {
    file: {
        level: 'info',
        filename: './logs/' + moment().format('YYYY-MM-DD HH-mm-ss') + '.log',
        handleExceptions: true,
        json: true,
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
