'use strict';
const sql = require('mssql');
const rx = require('rxjs');
const operators = require('rxjs/operators');
const ibuki = require('./ibuki');
const config = require('../config');
const dbConfig = config.dbConfig;
const pool = new sql.ConnectionPool(dbConfig);
let req1 = null,
    req2 = null;

function createRequest() {
    const req = new sql.Request(pool);
}

function queryRequest(req) {
    req.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
        // ... error checks
        // console.log(result.recordset[0].number) // return 1
        config.prepared.next(1);
    })
}

function disburse() {
    if(req1.pending){
        if(req2.pending){
            //wait until somebody is available
            let sub1 = rx.interval(30).subscribe(d=>{
                if((!req1.pending) || (!req2.pending)){
                    ibuki.emit('sql1-update:util>db1');
                    sub1.unsubscribe();
                }
            })
        } else {
            req2.pending = true;
            req2.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
                req2.pending = false;
                if (err) {
                    console.log('req2:', err);
                } else {                    
                    // config.prepared.next(1);
                    console.log('req 2');
                }
    
            })
        }
    } else{
        req1.pending = true;
        req1.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
            req1.pending = false;
            if (err) {
                console.log('req1:', err);
            } else {
                req1.pending = false;
                // config.prepared.next(1);
                console.log('req 1');
            }
        });
    }
}

ibuki.filterOn('sql1-update:util>db1').subscribe(d=>{
    disburse();
});

ibuki.filterOn('sql1-init:index:db').subscribe(
    d => {
        pool.connect(err => {
            if (err) {
                console.log('1:', err)
            } else {
                ibuki.emit('serial-process:index:workbench');
                req1 = new sql.Request(pool);
                req2 = new sql.Request(pool);
                // config.zip.subscribe(d => {
                //     // queryRequest(req)
                //     disburse();
                // });
            }
        })
    });

    
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