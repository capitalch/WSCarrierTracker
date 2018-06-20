'use strict';
const ibuki = require('./artifacts/ibuki');
const research = require('./artifacts/research');
const errorHandler = require('./artifacts/error-handler');
const db = require('./artifacts/db');
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
process.domainError.run(function () {
    ibuki.emit('get-big-object:run>db');
});


