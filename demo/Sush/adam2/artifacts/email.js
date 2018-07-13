'use strict';
const ibuki = require('./ibuki');
const notify = require('./notify');
const settings = require('../settings.json');
const mandrill = require('mandrill-api/mandrill');
const mandrillClient = new mandrill.Mandrill(settings.config.mandrillApiKey);

const mailAddresses = settings.config.mailAddresses;

function getMailBody() {
    const carrierStatus = notify.getCarrierStatus();
    // const exceptions = notify.getExceptions();
    let s = '';
    // let exceptionBody = '';
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
    // if (exceptions && exceptions.length > 0) {
    //     exceptionBody = 'Exception packages where Detected.  Below are the packages:<br/>';
    //     exceptions.forEach((element) => {
    //         exceptionBody = exceptionBody + element.trackingNumber + "-" + element.status + '<br/>';
    //     })
    // }
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
    // <div> ${exceptionBody}</div>
    return (emailBody);
}

const subs = ibuki.filterOn('send-status-mail:handler>email').subscribe(() => {
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
    mandrillClient.messages.send({
        "message": message,
        "async": async
    }, function (result) {
        notify.logInfo('Status mail is sent');
        ibuki.emit('mail-processed:email>handler');
    }, function (e) {
        // Mandrill returns the error as an object with name and message keys
        ibuki.emit('mail-processed:email>handler');
        notify.pushError('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });
    subs.unsubscribe();
});

//deprecated code
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