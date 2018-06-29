'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
// const parseString = require('xml2js').parseString;
const notify = require('../notify');

const gso = {};
const tools = {

}

gso.processGso = (x) => {
    handleGso(x);
}

function handleGso(x) {
    const unifiedJson = {
        name: 'fex',
        trackingNumber: x.trackingNumber,
        status: 'delivered',
        dateTime: Date.now()
    };
    handler.buffer.next(unifiedJson);
}
module.exports = gso;