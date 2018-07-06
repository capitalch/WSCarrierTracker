'use strict';
const sql = require('mssql');
// const moment = require('moment');
const rx = require('rxjs');
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const sqlCommands = require('./sql-commands');
const notify = require('./notify');
const workbench = require('./workbench');

let db = {};
let reqs = [];
const tools = {
    setInputParams: (req, json) => {
        req.input('Status', sql.VarChar, json.status || 'No Status');
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
    setPsInputTypes: (ps) => {
        ps.input('Status', sql.VarChar);
        ps.input('Status_date', sql.VarChar);
        ps.input('Status_Time', sql.VarChar);
        ps.input('EstimatedDeliveryDate', sql.DateTime);
        ps.input('CarrierStatusCode', sql.VarChar);
        ps.input('CarrierStatusMessage', sql.VarChar);
        ps.input('SignedForByName', sql.VarChar);
        ps.input('ExceptionStatus', sql.Int);
        ps.input('RTS', sql.Int);
        ps.input('RTSTrackingNo', sql.VarChar);
        ps.input('DAMAGE', sql.Int);
        ps.input('DAMAGEMSG', sql.VarChar);
        ps.input('No_', sql.VarChar);

        ps.input('rn', sql.VarChar);
        ps.input('TrackingNumber', sql.VarChar);
        ps.input('ShippingAgentCode', sql.VarChar);
        ps.input('ActivityJson', sql.VarChar);
    },
    getPsParamsObject: (json) => {
        const obj = {
            Status: json.status || 'No Status',
            'Status_date': json.statusDate || '',
            'Status_Time': json.statusTime || '',
            EstimatedDeliveryDate: json.estimatedDeliveryDate ? new Date(json.estimatedDeliveryDate) : new Date('1900-01-01'),
            CarrierStatusCode: json.carrierStatusCode || '',
            CarrierStatusMessage: json.carrierStatusMessage || 'No Status',
            SignedForByName: json.signedForByName || '',
            ExceptionStatus: json.exceptionStatus || 0,
            RTS: json.rts || 0,
            RTSTrackingNo: json.rtsTrackingNo || '',
            DAMAGE: json.damage || 0,
            DAMAGEMSG: json.damageMsg || '',
            No_: json.rn,

            rn: json.rn,
            TrackingNumber: json.trackingNumber,
            ShippingAgentCode: json.shippingAgentCode,
            ActivityJson: JSON.stringify(json.activityJson)

        };
        return (obj);
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
                const req1 = new sql.Request(handler.pool);
                req1.query(sqlCommands.getInfos, (err, result) => {
                    if (err) {
                        notify.pushError(err);
                        ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 2));
                    } else {
                        ibuki.emit('handle-big-object:db>workbench', result.recordset);
                    }
                });
                createPsRequests();
            }
        }
    );
});

const createPsRequests = () => {
    for (let i = 0; i < (settings.db.pool.max - 2); i++) {
        const ps = new sql.PreparedStatement(handler.pool);
        tools.setPsInputTypes(ps);
        const packageHistorySql = sqlCommands.insertPackageHistory;
        let sqlCommand = sqlCommands.updateInfoAndInsertInPackageHistory
            .concat(`${packageHistorySql}`);
        ps.isAvailable = true;
        ps.index = i;
        ps.prepare(sqlCommand, (err) => {
            if (err) {
                notify.pushError(err);
            } else {
                ps.multiple = true;
                reqs.push(ps);
            }
        });
    }
}

handler.sub5 = handler.buffer.subscribe(d => {
    disburse(d);
});

const disburse = (data) => {
    let ps = reqs.find((e) => e.isAvailable);
    if (ps) {
        ps.isAvailable = false;
        notify.addDbRequest(data.shippingAgentCode);
        const psParamsObject = tools.getPsParamsObject(data);
        ps.execute(psParamsObject, (err, result) => {
            ps.isAvailable = true;
            if (err) {
                notify.pushError(err);
                notify.addDbError(data.shippingAgentCode);
            } else {
                notify.addDbResponse(data.shippingAgentCode);
            }
        });
    } else {
        const myInterval = rx.interval(1000);
        const subs = myInterval.subscribe(()=>{
            subs.unsubscribe();
            handler.buffer.next(data);
        });
    }
}

handler.sub12 = ibuki.filterOn('db-log:handler>db').subscribe(d => {
    const req1 = new sql.Request(handler.pool);
    tools.setLogInputParams(req1, notify.getJobRunStatus());
    const sqlCommand = sqlCommands.insertPackageLog;
        req1.query(sqlCommand, (err, result) => {
            req1.isAvailable = true;
            if (err) {
                notify.pushError(err);
            }
            ibuki.emit('cleanup:db>handler');
        })
});
module.exports = db;


// const createRequests = () => {
//     for (let i = 0; i < settings.db.pool.max; i++) {
//         const req = new sql.Request(handler.pool);
//         req.isAvailable = true;
//         req.index = i;
//         reqs.push(req);
//     }
// }

// const disburse = (data) => {
//     let req = reqs.find((e) => e.isAvailable);
//     if (req) {
//         req.isAvailable = false;
//         req.multiple = true;
//         // tools.setInputParams(req, data);
//         notify.addDbRequest();
//         const packageHistorySql = sqlCommands.insertPackageHistory;
//         // let sqlCommandTest = 'update product set UnitPrice = UnitPrice + 1 where id = 1;';
//         let sqlCommand = sqlCommands.updateInfoAndInsertInPackageHistory1;
//         // .concat(data.activityJson ? `${packageHistorySql}` : '');

//         req.query(sqlCommand, (err, result) => {
//             req.isAvailable = true;
//             if (err) {
//                 notify.pushError(err);
//                 notify.addDbError();
//             } else {
//                 notify.addDbResponse();
//             }
//         });
//     } else {
//         setTimeout(() => {
//             disburse(data);
//         }, 1000);
//     }
// }