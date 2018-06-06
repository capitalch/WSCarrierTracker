'use strict';
const http = require('http');
const ibuki = require('./artifacts/ibuki');
const config = require('./config');
const db = require('./artifacts/db');
const workbench = require('./artifacts/workbench');
const app = require('./artifacts/app');
const util = require('./artifacts/util');

ibuki.filterOn('initialize').subscribe(d => {
    ibuki.emit('test-seq-promises-start:index:workbench');
});

// ibuki.emit('initialize', {});

// ibuki.emit('sql1:index:db');
ibuki.emit('start-processing-carrier:index:workbench');
