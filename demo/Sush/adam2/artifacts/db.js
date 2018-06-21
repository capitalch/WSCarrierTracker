'use strict';
const sql = require('mssql');
const ibuki = require('./ibuki');
const handler = require('./handler');
const settings = require('../settings.json');
const sqlCommands = require('./sql-commands');
const workbench = require('./workbench');

let dbRequests = 0;
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
                // const req = new sql.Request(handler.pool);
                req.isAvailable = false;
                req.query(sqlCommands.getInfos, (err, result) => {
                    if (err) {
                        ibuki.emit('app-error:any', handler.frameError(err, 'db', 'fatal', 2));
                    } else {

                        ibuki.emit('handle-big-object:db>workbench', result.recordset);
                        // console.log(result.recordset);
                        // handler.cleanup();
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
        dbRequests++;
        console.log('db requests:',dbRequests);
        req.query('update product set UnitPrice = UnitPrice+1 where id = 1', (err, result) => {
            dbRequests--;
            if(info && (info.carrierCount===0) && (dbRequests===0)) {
                console.log('Actual end');
                workbench.sub3.unsubscribe();
                pool.close();
            }
            console.log('db requests:',dbRequests);
            req.isAvailable = true;
            if (err) {
                console.log(err);
            } else {
                // console.log('req fulfilled: ', req.index);
            }
        })
    } else {
        let sub1 = rx.interval(30).subscribe(d => {
            if (reqs.some(e => e.isAvailable)) {
                ibuki.emit('sql1-update:util>db1');
                sub1.unsubscribe();
            };
        })
    }
}

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