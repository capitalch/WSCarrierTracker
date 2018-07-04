'use strict';
const sql = require('mssql');
// const moment = require('moment');
// const rx = require('rxjs');
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const sqlCommands = require('./sql-commands');
const notify = require('./notify');
const workbench = require('./workbench');

// let dbRequests = 0;
let db = {};
let reqs = [];
const tools = {
    setInputParams: (req, json) => {
        req.input('Status', sql.VarChar, json.status ||'No Status');
        req.input('Status_date', sql.VarChar, json.statusDate || '');
        req.input('Status_Time', sql.VarChar, json.statusTime || '');
        req.input('EstimatedDeliveryDate', sql.DateTime, json.estimatedDeliveryDate ? new Date(json.estimatedDeliveryDate) : new Date('1900-01-01'));
        req.input('CarrierStatusCode', sql.VarChar, json.carrierStatusCode || '');
        req.input('CarrierStatusMessage', sql.VarChar, json.carrierStatusMessage || 'No Status');
        req.input('SignedForByName', sql.VarChar, json.signedForByName || '');
        req.input('ExceptionStatus', sql.Int, json.exceptionStatus || 0);
        req.input('RTS', sql.Int, json.rts || 0);
        req.input('RTSTrackingNo', sql.VarChar, json.rtsTrackingNo || '');
        req.input('DAMAGE', sql.Int, json.damage || 0);
        req.input('DAMAGEMSG', sql.VarChar, json.damageMsg || '');
        req.input('No_', sql.VarChar, json.rn);
        if (json.activityJson) {
            req.input('rn', sql.VarChar, json.rn);
            req.input('TrackingNumber', sql.VarChar, json.trackingNumber);
            req.input('ShippingAgentCode', sql.VarChar, json.shippingAgentCode);
            req.input('ActivityJson', sql.VarChar, JSON.stringify(json.activityJson));
        }
    },
    setLogInputParams: (req, json) => {
        req.input('ApiRequests', sql.Int, json.apiRequests);
        req.input('ApiResponses', sql.Int, json.apiResponses);
        req.input('ApiErrors', sql.Int, json.apiErrors);
        req.input('DbRequests', sql.Int, json.dbRequests);
        req.input('DbResponses', sql.Int, json.dbResponses);
        req.input('DbErrors', sql.Int, json.dbErrors);
        req.input('StartTime', sql.VarChar, json.startTime);
        req.input('EndTime', sql.VarChar, json.endTime);
        req.input('Duration', sql.VarChar, json.duration);
    }
};
handler.pool = new sql.ConnectionPool(settings.db);
handler.sub0 = ibuki.filterOn('get-big-object:run>db').subscribe(d => {
    handler.pool.connect(
        err => {
            if (err) {
                notify.pushError(err);
                ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 1));
            } else {
                createRequests();
                const req = reqs.find((e) => e.isAvailable);
                req.isAvailable = false;
                req.query(sqlCommands.getInfos, (err, result) => {
                    if (err) {
                        notify.pushError(err);
                        ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 2));
                    } else {
                        ibuki.emit('handle-big-object:db>workbench', result.recordset);
                    }
                    req.isAvailable = true;
                });

            }
        }
    );
});

const createRequests = () => {
    for (let i = 0; i < settings.db.pool.max; i++) {
        const req = new sql.Request(handler.pool);
        req.isAvailable = true;
        req.index = i;
        reqs.push(req);
    }
}

handler.sub5 = handler.buffer.subscribe(d => {
    disburse(d);
});

const disburse = (data) => {
    let req = reqs.find((e) => e.isAvailable);
    if (req) {
        req.isAvailable = false;
        req.multiple = true;
        tools.setInputParams(req, data);
        notify.addDbRequest();
        const packageHistorySql = sqlCommands.insertPackageHistory;
        // let sqlCommandTest = 'update product set UnitPrice = UnitPrice + 1 where id = 1;';
        let sqlCommand = sqlCommands.updateInfoAndInsertInPackageHistory
        .concat(data.activityJson ? `${packageHistorySql}` : '');
        req.query(sqlCommand, (err, result) => {
            req.isAvailable = true;
            if (err) {
                notify.pushError(err);
                notify.addDbError();
            } else {
                notify.addDbResponse();
            }
        });
    } else {
        setTimeout(() => {
            disburse(data);
        }, 1000);
    }
}

handler.sub12 = ibuki.filterOn('db-log:handler>db').subscribe(d => {
    let req = reqs.find((e) => e.isAvailable);
    if (req) {
        req.isAvailable = false;
        tools.setLogInputParams(req,notify.getJobRunStatus());
        const sqlCommand = sqlCommands.insertPackageLog;
        req.query(sqlCommand, (err, result) => {
            req.isAvailable = true;
            if (err) {
                notify.pushError(err);
                //log the error
            }
            ibuki.emit('cleanup:db>handler');
        })
    }
});
module.exports = db;