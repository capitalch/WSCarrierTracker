const mssql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');
'use strict';
const dbConfig = config.dbConfig;
const pool = new mssql.ConnectionPool(dbConfig);
const logger = require('./logger');

ibuki.filterOn('sql1:index:db').subscribe(
    d => {
        pool.connect(err => {
            err || pool.request().query(`select top 1000 rn,[External Tracking No_] 'External',[Shipping Agent Code] 'Shipping'
            from [dbo].[FinalPackageTrackStaging]`,
                (err1, result) => {
                    logger.info('result.rowsAffected :',result.rowsAffected);
                    ibuki.emit('serial-process:db:workbench', {
                        bigObject: result.recordset
                    });

                });

        })
    }
);