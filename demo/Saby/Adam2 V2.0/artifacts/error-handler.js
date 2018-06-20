'use strict';
const ibuki = require('./ibuki');
const domain = require('domain');

//process is global variable. Let the domain error ride on process variable so that it is available everywhere
process.domainError = domain.create();
process.domainError.on('error', function(err){
    // console.log(err);
    process.exit(100);
});

process.on('exit',function(ex){
    // global.gc();
    // console.log(process.memoryUsage());
    console.log('Exiting the node:', ex);
});