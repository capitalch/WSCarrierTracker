'use strict';
const sql = require('mssql');
// const _ = require('lodash');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const ibuki = require('./ibuki');
const config = require('../config');
const dbConfig = config.dbConfig;
const pool = new sql.ConnectionPool(dbConfig);
let reqs = [];
let req1 = null,
    req2 = null;

function disburse() {
    const req = reqs.find((e) => e.isAvailable);
    if (req) {
        req.isAvailable = false;
        req.query('update product set UnitPrice = UnitPrice+1 where id = 1', (err, result) => {
            req.isAvailable = true;
            if (err) {
                console.log(err);
            } else {
                console.log('req fulfilled: ', req.index);
            }
        })
    } else {
        let sub1 = rx.interval(30).subscribe(d => {
            if (reqs.some(e => e.isAvailable)) {
                ibuki.emit('sql1-update:util>db1');
                sub1.unsubscribe();
            };
        })
    }
}

ibuki.filterOn('sql1-update:util>db1').subscribe(d => {
    disburse();
});

try {
    ibuki.filterOn('sql1-init:index:db').subscribe(
        d => {
            // try {
                //throw 'test error';
               
                pool.connect(err => {

                    if (err) {
                        console.log('1:', err)
                    } else {
                        ibuki.emit('serial-process:index:workbench');
                        for (let i = 0; i < 10; i++) {
                            const req = new sql.Request(pool);
                            req.isAvailable = true;
                            req.index = i;
                            reqs.push(req);
                        }
                    }
                });
            // } catch (err) {
            //     console.log(err);
            //     ibuki.emit('global-errors:any>any', err);
            // }
        }, err => { 
            console.log(err); 
        }

    );
} catch (err) {
    console.log(err.message);
}


// if (req1.pending) {
//     req2.pending = true;
//     req2.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
//         if (err) {
//             console.log('req2:', err);
//         } else {
//             req2.pending = false;
//             // config.prepared.next(1);
//             console.log('req 2');
//         }

//     })
// } else {
//     req1.pending = true;
//     req1.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
//         if (err) {
//             console.log('req1:', err);
//         } else {
//             req1.pending = false;
//             // config.prepared.next(1);
//             console.log('req 1');
//         }
//     })
// }
// function createRequest() {
//     const req = new sql.Request(pool);
// }

// function queryRequest(req) {
//     req.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
//         // ... error checks
//         // console.log(result.recordset[0].number) // return 1
//         config.prepared.next(1);
//     })
// }