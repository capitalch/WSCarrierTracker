'use strict';
// const nodemailer = require('nodemailer');
const ibuki = require('./ibuki');
const notify = require('./notify');
// const handler = require('./handler');
const settings = require('../settings.json');
const mandrill = require('mandrill-api/mandrill');
// const mandrillClient = new mandrill.Mandrill('r96zzCYUlKTLJ8e620HbKQ');
const mandrillClient = new mandrill.Mandrill(settings.config.mandrillApiKey);

const mailAddresses = settings.config.mailAddresses;

function getMailBody() {
    const carrierStatus = notify.getCarrierStatus();
    let s = '';
    Object.keys(carrierStatus).forEach((key) => {
        s = s + `<tr>
        <td>${key}</td>
        <td>${carrierStatus[key].delivered}</td>
        <td>${carrierStatus[key].notDelivered}</td>
        <td>${carrierStatus[key].return}</td>        
        <td>${carrierStatus[key].damage}</td>
        <td>${carrierStatus[key].exception}</td>
    </tr>`;
    });
    const emailBody = `
    <style>
        table {
            font-family: arial, sans-serif;
            border-collapse: collapse;
            width: 100%;
        }

        td, th {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
        }
    </style>
    <div>
        <table>
            <tr>
                <td>Carrier</td>
                <td>Delivered</td>
                <td>Not Delivered</td>
                <td>Return</td>
                <td>Damage</td>
                <td>Exception</td>
            </tr>${s}
        </table>
    </div>`;
    return (emailBody);
}

const subs = ibuki.filterOn('send-status-mail:handler>email').subscribe(() => {
    // console.log(getMailBody());
    let html = getMailBody();
    var message = {
        "html": html,
        "text": "Wine Shipping Job run status",
        "subject": "Status report for Job run of Carrier Tracker",
        "from_email": "noreply@wineshippingalerts.com",
        "to": mailAddresses,
        "important": false
    };
    var async = false;
    mandrillClient.messages.send({ "message": message, "async": async }, function (result) {
        // console.log(result);
        notify.logInfo('Status mail is sent');
        ibuki.emit('mail-processed:email>handler');
    }, function (e) {
        // Mandrill returns the error as an object with name and message keys
        ibuki.emit('mail-processed:email>handler');
        notify.pushError('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
    subs.unsubscribe();
});

// mailOptions.html = getMailBody()
// transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('Email sent: ' + info.response);
//     }
//     ibuki.emit('mail-processed:email>handler')
//     subs.unsubscribe();
// });

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'kushinfotech@gmail.com',
//         pass: 'su$hant1234'
//     }
// });

// var mailOptions = {
//     from: 'kushinfotech@gmail.com',
//     to: mailAddresses.toString(),
//     subject: 'Sending Email using Node.js'
// };