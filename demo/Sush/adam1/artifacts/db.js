const mssql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');
'use strict';
const dbConfig = config.dbConfig;
const pool = new mssql.ConnectionPool(dbConfig);

ibuki.filterOn('sql1:index:db').subscribe(
    d => {
        pool.connect(err => {
            err || pool.request().query(`select rn,[External Tracking No_] 'External',[Shipping Agent Code] 'Shipping'
            from [dbo].[FinalPackageTrackStaging]`,
            (err1, result) => {
                console.log('Done and fire');
                ibuki.emit('serial-process:db:workbench', {
                    bigObject: result.recordset
                });

            });

        })
    }
);

ibuki.filterOn('sql2:util:db').subscribe(
    d => {
        console.log(`updatePackagesToTrack ${d.data.status},${d.data.rn}`);
       console.log(pool.connected); 
        pool.request().query(`updatePackagesToTrack ${d.data.status},${d.data.rn}`,
            (err1, result) => {
                result && console.log('success');
                err1 && console.log( 'error',err1);
            });
    });
