'use strict';
const sql = require('mssql');
const _ = require('lodash');
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
const maxDbErrorCount = _.has(settings, 'config.maxDbErrorCount') ? settings.config.maxDbErrorCount : 100;
const tools = {
    // setInputParams: (req, json) => {
    //     req.input('Status', sql.VarChar, json.status || 'No Status');
    //     req.input('Status_date', sql.VarChar, json.statusDate || '');
    //     req.input('Status_Time', sql.VarChar, json.statusTime || '');
    //     req.input('EstimatedDeliveryDate', sql.DateTime, json.estimatedDeliveryDate ? new Date(json.estimatedDeliveryDate) : new Date('1900-01-01'));
    //     req.input('CarrierStatusCode', sql.VarChar, json.carrierStatusCode || '');
    //     req.input('CarrierStatusMessage', sql.VarChar, json.carrierStatusMessage || 'No Status');
    //     req.input('SignedForByName', sql.VarChar, json.signedForByName || '');
    //     req.input('ExceptionStatus', sql.Int, json.exceptionStatus || 0);
    //     req.input('RTS', sql.Int, json.rts || 0);
    //     req.input('RTSTrackingNo', sql.VarChar, json.rtsTrackingNo || '');
    //     req.input('DAMAGE', sql.Int, json.damage || 0);
    //     req.input('DAMAGEMSG', sql.VarChar, json.damageMsg || '');
    //     req.input('No_', sql.VarChar, json.rn);
    //     if (json.activityJson) {
    //         req.input('rn', sql.VarChar, json.rn);
    //         req.input('TrackingNumber', sql.VarChar, json.trackingNumber);
    //         req.input('ShippingAgentCode', sql.VarChar, json.shippingAgentCode);
    //         req.input('ActivityJson', sql.VarChar, JSON.stringify(json.activityJson));
    //     }
    // },
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
        req.input('ApiRequests', sql.Int, json.apiReq);
        req.input('ApiResponses', sql.Int, json.apiRes);
        req.input('ApiErrors', sql.Int, json.apiErr);
        req.input('DbRequests', sql.Int, json.dbReq);
        req.input('DbResponses', sql.Int, json.dbRes);
        req.input('DbErrors', sql.Int, json.dbErr);
        req.input('StartTime', sql.VarChar, json.startTime);
        req.input('EndTime', sql.VarChar, json.endTime);
        req.input('Duration', sql.VarChar, json.duration);
    }
};
handler.pool = new sql.ConnectionPool(settings.db);
handler.sub0 = ibuki.filterOn('get-big-object:run>db').subscribe(() => {
    handler.pool.connect(
        err => {
            if (err) {
                notify.pushError(err);
                ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
            } else {
                const req1 = new sql.Request(handler.pool);
                req1.query(sqlCommands.getInfos, (err, result) => {
                    if (err) {
                        notify.pushError(err);
                        ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
                    } else {
                        createPsRequests();
                        ibuki.emit('handle-big-object:db>workbench', result.recordset);
                    }
                });
            }
        }
    );
});
handler.beforeCleanup(handler.sub0);

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
handler.beforeCleanup(handler.sub5);

const disburse = (data) => {
    let ps = reqs.find((e) => e.isAvailable);
    if (ps) {
        ps.isAvailable = false;
        notify.addApiToDb(data.shippingAgentCode);

        const psParamsObject = tools.getPsParamsObject(data);

        ps.execute(psParamsObject, (err) => {
            notify.addDbRequest(data.shippingAgentCode);
            ps.isAvailable = true;
            if (err) {
                notify.pushError(err);
                notify.addDbError(data.shippingAgentCode);
                if (notify.getDbErrors() >= maxDbErrorCount) {
                    ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
                }
            } else {
                notify.addDbResponse(data.shippingAgentCode);
            }
        });
    } else {
        const myInterval = rx.interval(1000);
        const subs = myInterval.subscribe(() => {
            subs.unsubscribe();
            handler.buffer.next(data);
        });
    }
}

handler.sub12 = ibuki.filterOn('db-log:handler>db').subscribe(() => {
    const req1 = new sql.Request(handler.pool);
    tools.setLogInputParams(req1, notify.getJobRunStatus());
    const sqlCommand = sqlCommands.insertPackageLog;
    req1.query(sqlCommand, (err) => {
        req1.isAvailable = true;
        if (err) {
            notify.pushError(err);
        }
        ibuki.emit('cleanup:db>handler');
    })
});
handler.beforeCleanup(handler.sub12);

module.exports = db;