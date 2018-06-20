'use strict';
const ibuki = require('./ibuki');
const rx = require('rxjs');
const operators = require('rxjs/operators');
// const axios = require('axios');
// const _ = require('lodash');
// const operators = require('rxjs/operators');
// const Q = require('q');
const util = require('./util');
var config = require('../config');

var workbench = {};
var counter = 0;
var subject = new rx.Subject();

workbench.sub2 = ibuki.filterOn('serial-process:db1:workbench').subscribe(
    d => {
        let carrierInfos = util.getCarrierInfos('Fedex', 10);
        // const carrierInfos = d.data;
        config.carrierCount = carrierInfos.length;
        
        rx.from(carrierInfos)
            .pipe(
                operators.concatMap(x => rx.of(x).pipe(operators.delay(config.piston)))
            )
            .subscribe(
                x => {
                    config.requestCount++;
                    util.processCarrierSerially(x);
                }
            );
        ibuki.emit('adjust-piston:self');        
    }
);

workbench.sub1 = ibuki.filterOn('adjust-piston:self').subscribe(
    d => {
        const myInterval = rx.interval(500);
        workbench.sub3 = myInterval.subscribe((x) => {
            const queue = config.requestCount - config.responseCount - config.errorCount;
            if (queue === 0) {
                config.autoPilotPiston && (config.piston = 0);
            }
            else if (queue > 100) {
                config.autoPilotPiston && (config.piston = config.piston + 10);
            } else {
                config.autoPilotPiston && (config.piston = (config.piston > 5) ? (config.piston = config.piston - 5) : (config.piston = config.piston));
            }
            // console.log('Piston adjusted:');
        });
        // sub3.unsubscribe();
    }
)
module.exports = workbench;
