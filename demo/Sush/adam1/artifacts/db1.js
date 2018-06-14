'use strict';
const sql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');
const dbConfig = config.dbConfig;
const pool = new sql.ConnectionPool(dbConfig);

function createRequest() {

    // ps = new sql.PreparedStatement(pool);
    // ps.input('id', sql.Int);
    // ps.prepare('update product set UnitPrice = UnitPrice + 1 where id = @id', err => {
    //     if (err) {
    //         console.log('0 ', err);
    //     } else {
    //         config.zip.subscribe(d => executePS(ps));
    //     }
    // });


    const req = new sql.Request(pool);
    config.zip.subscribe(d => queryRequest(req));
}

function queryRequest(req) {
    req.query('update product set UnitPrice = UnitPrice+1', (err, result) => {
        // ... error checks
        // console.log(result.recordset[0].number) // return 1
        config.prepared.next(1);
    })
}


ibuki.filterOn('sql1-init:index:db').subscribe(
    d => {
        pool.connect(err => {
            if (!err) {
                ibuki.emit('serial-process:index:workbench');
                createRequest();
                createRequest();
            }
        });
    }
);