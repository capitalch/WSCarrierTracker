'use strict';
const ibuki = require('./artifacts/ibuki');
const handler = require('./artifacts/handler');
const notify = require('./artifacts/notify');
const api = require('./artifacts/api'); //needed
// const db = require('./artifacts/db'); //needed
// const research = require('./artifacts/research');


notify.setTime('start');
notify.logInfo('New Job started at ' + notify.getTime('start'));
handler.domainError.run(function () {
    ibuki.emit('get-big-object:run>db');
});