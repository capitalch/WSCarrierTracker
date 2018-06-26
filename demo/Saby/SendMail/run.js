const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('key');
const msg = {
    to: ['sbal@netwoven.com'],
    from: 'noreply@example.org',
    subject: 'Hello world',
    text: 'Hello plain world!',
    html: '<p>Hello HTML world!</p>',
};
sgMail.send(msg).then(() => {
    console.log('Success');
}).catch(error => {

    //Log friendly error
    console.error(error.toString());

    //Extract error msg
    const { message, code, response } = error;

    //Extract response msg
    const { headers, body } = response;
});
