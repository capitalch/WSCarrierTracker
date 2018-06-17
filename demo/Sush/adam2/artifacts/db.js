'use strict';
const sql = require('mssql');
const ibuki = require('./ibuki');
const config = require('../config');
const dbConfig = config.dbConfig;
const pool = new sql.ConnectionPool(dbConfig);

function preparePS(ps) {
    ps = new sql.PreparedStatement(pool);
    ps.input('id', sql.Int);
    ps.prepare('update product set UnitPrice = UnitPrice + 1 where id = @id', err => {
        if (err) {
            console.log('0 ', err);
        } else {
            config.zip.subscribe(d => executePS(ps));
        }
    });
}

function executePS(ps) {
    ps.execute({ id: 1 }, (err, result) => {
        // ... error checks
        if (err) {
            console.log('1 ', err);
        } else {
            let x = 1;
        }
        config.prepared.next(1);
    });
}

ibuki.filterOn('sql1-init:index:db').subscribe(
    d => {
        pool.connect(err => {
            if (!err) {
                ibuki.emit('serial-process:index:workbench');
                let ps1 = {};
                preparePS(ps1);
            }
        });

        // pool.connect(err => {
        //     if (!err) {
        //         // ibuki.emit('serial-process:index:workbench');
        //         let ps2={};
        //         preparePS(ps2);
        //     }
        // });

        // pool.connect(err => {
        //     if (!err) {
        //         // ibuki.emit('serial-process:index:workbench');
        //         let ps3={};
        //         preparePS(ps3);
        //     }
        // });

        // pool.connect(err => {
        //     if (!err) {
        //         // ibuki.emit('serial-process:index:workbench');
        //         let ps4 = {};
        //         preparePS(ps4);
        //     }
        // });
    }
);

// ibuki.filterOn('sql1-update:util>db').subscribe(
//     d => {
//         const ps = new sql.PreparedStatement(pool);
//         ps.input('id', sql.Int);

//         let stmt = ps.prepare('update product set UnitPrice = UnitPrice + 1 where id = @id', err => {
//             // ... error checks
//             if (err) {
//                 console.log('0 ', err);
//             } else {

//                 config.prepared.next(1);
//                 config.zip.subscribe(d => execute(ps));
//                 // ps.execute({ id: 1 }, (err, result) => {
//                 //     // ... error checks
//                 //     if (err) {
//                 //         console.log('1 ', err);
//                 //     } else {
//                 //         let x = 1;
//                 //     }
//                 //                         // ps.execute({id:1}, (err,result)=>{
//                 //                         //     if(err){
//                 //                         //         console.log('3 ', err);
//                 //                         //     } else{
//                 //                         //         let x =3;
//                 //                         //     }
//                 //                         // });
//                 //                         // ps.unprepare(err => {
//                 //                         //     if (err) {
//                 //                         //         console.log('2 ', err)
//                 //                         //     } else {
//                 //                         //         let x = 2;
//                 //                         //     }
//                 //                         // })
//                 // });

//             }

//         })
//     }
// )