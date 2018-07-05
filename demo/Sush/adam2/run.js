'use strict';
const ibuki = require('./artifacts/ibuki');
const handler = require('./artifacts/handler');
const db = require('./artifacts/db');
// const research = require('./artifacts/research');
const notify = require('./artifacts/notify');

notify.setTime('start');
notify.logInfo('New Job started at '.concat(notify.getTime('start')));
handler.domainError.run(function () {
    ibuki.emit('get-big-object:run>db');
});