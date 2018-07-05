'use strict';
const moment = require('moment');
const sql = require('mssql');
const settings = require('../settings.json');
const handler = require('./handler');
const sqlCommands = require('./sql-commands');
//prepared statement
handler.pool = new sql.ConnectionPool(settings.db);
const ps = new sql.PreparedStatement(handler.pool);
handler.pool.connect(err => {
    if (err) {
        console.log(err);
    } else {
        ps.input('i', sql.Int)
        ps.prepare('update product set UnitPrice = UnitPrice + @i', err => {
            if (err) {
                console.log(err);
            }
            ps.execute({ i: 10 }, (err, result) => {
                if (err) {
                    console.log(err);
                }
                ps.unprepare(err => {
                    if (err) {
                        console.log(err);
                    }
                })
            })
        })
    }
})



// console.log('Research');
// var nodemailer = require('nodemailer');

// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'kushinfotech@gmail.com',
//     pass: 'su$hant1234'
//   }
// });

// let smtpConfig = {
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false, // upgrade later with STARTTLS
//     auth: {
//         user: 'kushinfotech@gmail.com',
//         pass: 'su$hant1234'
//     }
// };

// let smtpConfig = {
//     host: '10.10.1.40',
//     // port: 587,
//     secure: false, // upgrade later with STARTTLS
//     auth: {
//         user: 'WSIIS01@wineshipping.com'//,
//         // pass: 'su$hant1234'
//     }
// };


// let transporter = nodemailer.createTransport(smtpConfig);

// var mailOptions = {
//   from: 'kushinfotech@gmail.com',
//   to: 'capitalch@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });
// const obj = {name:"Test", message:"Test errors", stack:'Error generated in research.js, line 50'};
// throw obj;

// const start = moment();
// const end = moment();
// const diff = end.diff(start);
// const duration = moment.utc(diff).format("HH:mm:ss");
// console.log('duration:', duration);

// // set up
// let start = moment("2018-05-16 12:00:00"); // some random moment in time (in ms)
// let end = moment("2018-05-16 12:22:00"); // some random moment after start (in ms)
// let diff = end.diff(start);

// // execution
// let f = moment.utc(diff).format("HH:mm:ss.SSS");
// alert(f);