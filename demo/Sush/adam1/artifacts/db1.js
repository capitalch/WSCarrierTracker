'use strict';
const sql = require('mssql');
const rx = require('rxjs');
const workbench = require('./workbench');
const operators = require('rxjs/operators');
const ibuki = require('./ibuki');
const settings = require('./settings.json');
// const sqlCommands = require('./sql');
const config = require('../config');
// const dbConfig = config.dbConfig;
let pool = new sql.ConnectionPool(settings.db.config);
let dbRequests = 0;
let reqs = [];

function disburse(info) {
    const req = reqs.find((e) => e.isAvailable);
    
    if (req) {
        req.isAvailable = false;
        dbRequests++;console.log('db requests:',dbRequests);
        req.query('update product set UnitPrice = UnitPrice+1 where id = 1', (err, result) => {
            dbRequests--;
            if(info && (info.carrierCount===0) && (dbRequests===0)) {
                console.log('Actual end');
                workbench.sub3.unsubscribe();
                pool.close();
            }
            console.log('db requests:',dbRequests);
            req.isAvailable = true;
            if (err) {
                console.log(err);
            } else {
                // console.log('req fulfilled: ', req.index);
            }
        })
    } else {
        let sub1 = rx.interval(30).subscribe(d => {
            if (reqs.some(e => e.isAvailable)) {
                ibuki.emit('sql1-update:util>db1');
                sub1.unsubscribe();
            }
        })
    }
}

ibuki.filterOn('sql1-update:util>db1').subscribe(d => {
    disburse(d.data);
});

ibuki.filterOn('get-big-object:self').subscribe(d => {
    const req = new sql.Request(pool);
    req.query(sqlCommands.getInfos, (err, result) => {
        if (err) throw err;
        console.log(result);
        ibuki.emit('serial-process:db1:workbench', result.recordset);
    });
});

try {
    ibuki.filterOn('sql1-init:index:db1').subscribe(
        d => {
            try {
                // pool.connect(err=>{
                //     console.log('Inside pool');
                //     pool.close();
                // });
                pool.connect(err => {
                    if (err) {
                        console.log('1:', err);
                        pool.close();
                    } else {
                        ibuki.emit('serial-process:db1:workbench');
                        for (let i = 0; i < 10; i++) {
                            const req = new sql.Request(pool);
                            req.isAvailable = true;
                            req.index = i;
                            reqs.push(req);
                        }
                        // ibuki.emit('get-big-object:self');
                    }
                });
            } catch (err) {
                console.log(err);
                ibuki.emit('global-errors:any>any', err);
            }
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