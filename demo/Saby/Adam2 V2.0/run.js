'use strict';
const ibuki = require('./artifacts/ibuki');
const config = require('./artifacts/config');
const workbench = require('./artifacts/workbench');
const app = require('./artifacts/app');
const util = require('./artifacts/util');
const db1 = require('./artifacts/db1');
const parseXML = require('./artifacts/xml-parse');

// const domain = require('domain');
// const d = domain.create();
// d.on('error', function (err) {
//     console.log(err.stack);
//     process.exit(100);
// });

// ibuki.filterOn('global-errors:any>any').subscribe(
//     d => {
//         console.log(d.data);
//     }
// )
// process.domainError.run(function () {
//     ibuki.emit('get-big-object:run>db');
// });


ibuki.emit('sql1-init:index:db');
