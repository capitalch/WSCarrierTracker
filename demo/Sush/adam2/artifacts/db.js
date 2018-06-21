'use strict';
const sql = require('mssql');
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const sqlCommands = require('./sql-commands');
const workbench = require('./workbench');

let db = {};
handler.pool = new sql.ConnectionPool(settings.db);
handler.sub0 = ibuki.filterOn('get-big-object:run>db').subscribe(d => {
    handler.pool.connect(
        err => {
            if (err) {
                ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 1));
            } else {
                const req = new sql.Request(handler.pool);
                req.query(sqlCommands.getInfos, (err, result) => {
                    if (err) {
                        ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 2));
                    } else {
                        ibuki.emit('handle-big-object:db>workbench', result.recordset);
                        // console.log(result.recordset);
                        // handler.cleanup();
                    }
                });
            }
        }
    )
});
module.exports = db;

// const myInterval = rx.interval(5);
//     handler.sub1  = myInterval.subscribe(x=>{
//         console.log(x);
//     });
//     setTimeout(()=>handler.cleanup(), 100);
// function preparePS(ps) {
//     ps = new sql.PreparedStatement(pool);
//     ps.input('id', sql.Int);
//     ps.prepare('update product set UnitPrice = UnitPrice + 1 where id = @id', err => {
//         if (err) {
//             console.log('0 ', err);
//         } else {
//             config.zip.subscribe(d => executePS(ps));
//         }
//     });
// }

// function executePS(ps) {
//     ps.execute({ id: 1 }, (err, result) => {
//         // ... error checks
//         if (err) {
//             console.log('1 ', err);
//         } else {
//             let x = 1;
//         }
//         config.prepared.next(1);
//     });
// }

// ibuki.filterOn('sql1-init:index:db').subscribe(
//     d => {
//         pool.connect(err => {
//             if (!err) {
//                 ibuki.emit('serial-process:index:workbench');
//                 let ps1 = {};
//                 preparePS(ps1);
//             }
//         });
//     }
// );