const mssql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');

const dbConfig = config.dbConfig;
const pool = new mssql.ConnectionPool(dbConfig);

ibuki.filterOn('sql1:index:db').subscribe(
    d => {
        pool.connect(err => {
            err || pool.request().query('select * from dbo.customer;',
            (err1, result) => {
                console.log(result.recordset);
            });
        })

    }
);