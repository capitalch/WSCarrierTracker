'use strict';
const sql = require('mssql');
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

handler.pool = new sql.ConnectionPool(settings.db);
handler.sub0 = ibuki.filterOn('get-big-object:run>db').subscribe(d => {
    handler.pool.connect(
        err => {
            if (err) {
                ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 1));
            } else {
                createRequests();
                const req = reqs.find((e) => e.isAvailable);
                req.isAvailable = false;
                notify.addDbRequest();
                req.query(sqlCommands.getInfos, (err, result) => {
                    if (err) {
                        notify.addDbError();
                        ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 2));
                    } else {
                        notify.addDbResponse();
                        ibuki.emit('handle-big-object:db>workbench', result.recordset);
                    }
                    req.isAvailable = true;
                });
            }
        }
    )
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

const disburse = (info) => {
    const req = reqs.find((e) => e.isAvailable);
    if (req) {
        req.isAvailable = false;
        notify.addDbRequest();        
        req.query('update product set UnitPrice = UnitPrice+1 where id = 1', (err, result) => {
            // handler.dbRequests--;            
            req.isAvailable = true;
            if (err) {
                notify.addDbError();
            } else {
                notify.addDbResponse();
            }
        });
    } else {
        setTimeout(() => {
            disburse(info);
            // console.log('waiting for db channel to be freed up');
        }, 50);
    }
}

module.exports = db;
