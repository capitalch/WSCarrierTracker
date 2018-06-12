'use strict';
const sql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');
const dbConfig = config.dbConfig;
const pool = new sql.ConnectionPool(dbConfig);
const ps = new sql.PreparedStatement(pool);
const stmts = [];
ibuki.filterOn('sql1-init:index:db').subscribe(
    d => {
        // pool.connect(err => {
        //     err || pool.request().query('select * from dbo.customer;',
        //     (err1, result) => {
        //         console.log(result.recordset);
        //     });
        // });
        pool.connect(err => {
            if (!err) {
                ibuki.emit('serial-process:index:workbench');
            }
        });
    }
);

ibuki.filterOn('sql1-update:util>db').subscribe(
    d => {
        ps.input('id', sql.Int);
        let stmt = ps.prepare('update product set UnitPrice = UnitPrice + 1 where id = @id', err => {
            // ... error checks
            
            ps.execute({ id: 1 }, (err, result) => {
                // ... error checks
                let x = 1;
                // ps.unprepare(err => {
                //     // ... error checks

                // })
            })
        })
    }
)