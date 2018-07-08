'use strict';
const ibuki = require('./artifacts/ibuki');
const handler = require('./artifacts/handler');
const notify = require('./artifacts/notify');
const db = require('./artifacts/db');
// const research = require('./artifacts/research');


notify.setTime('start');
notify.logInfo('New Job started at ' + notify.getTime('start'));
handler.domainError.run(function () {
    ibuki.emit('get-big-object:run>db');
});