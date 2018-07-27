'use strict';
const ibuki = require('../ibuki');
const handler = require('../handler');

const tps = {};
handler.sub19 = ibuki.filterOn('process-tps:api>tps')
    .subscribe(d => processTps(d.data));
handler.beforeCleanup(handler.sub19);

const processTps = (x) => {
    console.log('tps :'+x);
}

module.exports = tps;