'use strict';
const ibuki = require('./artifacts/ibuki');
const research = require('./artifacts/research');
const handler = require('./artifacts/handler');
const db = require('./artifacts/db');

process.domainError.run(function () {
    ibuki.emit('get-big-object:run>db');
});