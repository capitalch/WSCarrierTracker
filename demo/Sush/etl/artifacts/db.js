'use strict';
const sql = require('mssql');
const _ = require('lodash');
const rx = require('rxjs');
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const sqlCommands = require('./sql-commands');
const notify = require('./notify');
const workbench = require('./workbench');

let db = {};
let reqs = [];
const myInterval = rx.interval(1000);
const maxDbErrorCount = _.has(settings, 'config.maxDbErrorCount') ? settings.config.maxDbErrorCount : 100;
let psParamsObject = null;
const tools = {
    setPsInputTypes: (ps) => {
        ps.input('ActivityJson', sql.VarChar);
        ps.input('rn', sql.VarChar);
        ps.input('TrackingNumber', sql.VarChar);
        ps.input('ShippingAgentCode', sql.VarChar);
    },
    getPsParamsObject: (json) => {
        const obj = {
            ActivityJson: JSON.stringify(json.ActivityJson),
            rn: json.rn,
            TrackingNumber: json.TrackingNumber,
            ShippingAgentCode: json.ShippingAgentCode
        };
        return (obj);
    }
};
handler.pool = new sql.ConnectionPool(settings.db);
handler.sub0 = ibuki.filterOn('get-big-object:run>db').subscribe(() => {
    handler.pool.connect(
        err => {
            if (err) {
                ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
            } else {
                const req1 = new sql.Request(handler.pool);
                req1.query(sqlCommands.getPackageHistory, (err, result) => {
                    if (err) {
                        ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
                    } else {
                        createPsRequests();
                        console.log('Record: '+result.recordset.length);
                        callBigObject(result.recordset);
                    }
                });
            }
        }
    );
});
handler.beforeCleanup(handler.sub0);
const callBigObject = (recordset) => {
    if (reqs.length < (settings.db.pool.max - 2)) {
        const subs = myInterval.subscribe(() => {
            subs.unsubscribe();
            callBigObject(recordset);
        });
    } else {
        console.log('reqs'+reqs.length);
        ibuki.emit('handle-big-object:db>workbench', recordset);
    }

}

const createPsRequests = () => {
    for (let i = 0; i < (settings.db.pool.max - 2); i++) {
        const ps = new sql.PreparedStatement(handler.pool);
        tools.setPsInputTypes(ps);
        let sqlCommand = sqlCommands.processEtl;
        ps.isAvailable = true;
        ps.index = i;
        ps.prepare(sqlCommand, (err) => {
            if (err) {
                ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
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

//const myInterval = rx.interval(1000);
const disburse = (data) => {
    let ps = reqs.find((e) => e.isAvailable);
    if (ps) {
        ps.isAvailable = false;
        notify.addApiToDb(data.carrierName);
        psParamsObject = tools.getPsParamsObject(data);
        ps.execute(psParamsObject, (err) => {
            notify.addDbRequest(data.carrierName);
            ps.isAvailable = true;
            if (err) {
                notify.addDbError(data.carrierName);
                if (notify.getDbErrors(data.carrierName) >= maxDbErrorCount) {
                    err.message = 'Max db error count exceeded than allowed limit.'.concat(err.message);
                    ibuki.emit('app-error:any', (err.severity = 'fatal') && err);
                }
            } else {
                notify.addDbResponse(data.carrierName);
            }
        });
    } else {
        const subs = myInterval.subscribe(() => {
            subs.unsubscribe();
            handler.buffer.next(data);
        });
    }
}

module.exports = db;