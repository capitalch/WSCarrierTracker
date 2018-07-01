'use strict';
// console.log('Research');
var nodemailer = require('nodemailer');

// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'kushinfotech@gmail.com',
//     pass: 'su$hant1234'
//   }
// });

let smtpConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: 'kushinfotech@gmail.com',
        pass: 'su$hant1234'
    }
};

let transporter = nodemailer.createTransport(smtpConfig);

var mailOptions = {
  from: 'kushinfotech@gmail.com',
  to: 'capitalch@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});