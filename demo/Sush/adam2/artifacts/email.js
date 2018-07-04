'use strict';
const nodemailer = require('nodemailer');
const ibuki = require('./ibuki');
const notify = require('./notify');
const handler = require('./handler');
const settings = require('../settings.json');

const mailAddresses = settings.config.mailAddresses;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kushinfotech@gmail.com',
        pass: 'su$hant1234'
    }
});

var mailOptions = {
    from: 'kushinfotech@gmail.com',
    to: mailAddresses.toString(),
    subject: 'Sending Email using Node.js'
};

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
    mailOptions.html = getMailBody()
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
        ibuki.emit('mail-processed:email>handler')
        subs.unsubscribe();
    });
});