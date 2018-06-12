'use strict';
const sql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');
const dbConfig = config.dbConfig;
const pool = new sql.ConnectionPool(dbConfig);

ibuki.filterOn('sql1:index:db').subscribe(
    d => {
        // pool.connect(err => {
        //     err || pool.request().query('select * from dbo.customer;',
        //     (err1, result) => {
        //         console.log(result.recordset);
        //     });
        // });


        pool.connect(err => {
            if (!err) {
                const ps = new sql.PreparedStatement(pool)
                ps.input('id', sql.Int)
                ps.prepare('update product set UnitPrice = UnitPrice + 1 where id = @id', err => {
                    // ... error checks

                    ps.execute({ id: 1 }, (err, result) => {
                        // ... error checks

                        ps.unprepare(err => {
                            // ... error checks

                        })
                    })
                })
            }
        })
    }
);