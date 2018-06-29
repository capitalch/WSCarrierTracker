'use strict';
const moment = require('moment');
const ibuki = require('../ibuki');
const handler = require('../handler');
// const parseString = require('xml2js').parseString;
const notify = require('../notify');

const ups = {};
const tools = {

}

ups.processUps = (x) => {
    handleGso(x);
}

function handleUps(x) {

}

module.exports = ups;