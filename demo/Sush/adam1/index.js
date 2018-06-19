'use strict';
const http = require('http');
const ibuki = require('./artifacts/ibuki');
const config = require('./config');
// const db = require('./artifacts/db');
const db1 = require('./artifacts/db1');
const workbench = require('./artifacts/workbench');
const app = require('./artifacts/app');
const util = require('./artifacts/util');
const research = require('./artifacts/research');
// const test = require('./artifacts/util').test;
// const numCPUs = require('os').cpus().length;
ibuki.filterOn('global-errors:any>any').subscribe(
    d => {
        console.log(d.data);
    }
)



var domain = require('domain');
var d = domain.create();
// Domain emits 'error' when it's given an unhandled error
d.on('error', function(err) {
  console.log(err.stack);
  process.exit(100);
 // Our handler should deal with the error in an appropriate way
});

// Enter this domain
// d.run(function() {
//   // If an un-handled error originates from here, process.domain will handle it
//   console.log(process.domain === d); // true
// });

ibuki.filterOn('initialize').subscribe(d => {
    // ibuki.emit('test-seq-promises-start:index:workbench');
});

// ibuki.emit('initialize', {});

// ibuki.emit('sql1:index:db');
// ibuki.emit('start-processing-carrier:index:workbench');
// ibuki.emit('serial-process:index:workbench');
// ibuki.emit('serial-process-delayed:index:workbench');
// ibuki.emit('serial-process:index:workbench');
// ibuki.emit('sql1-init:index:db');
// ibuki.emit('test-zip:index>research');
// ibuki.emit('test-merge:index>research');

d.run(function() {
    ibuki.emit('sql1-init:index:db');
  });
