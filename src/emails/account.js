const sgMail = require('@sendgrid/mail');
const sendgridAPIKey = '';

sgMail.setApiKey(sendgridAPIKey);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mlanden1221@gmail.com',
        subject: 'Welcome to the Task Manager App',
        text: `Hi ${name},\n\nWelcome to Task Manager.\nFeel free to reply with any questions or comments.`,
    });
};

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mlanden1221@gmail.com',
        subject: 'Sorry to see you go',
        text: `Hi ${name},\n\nPlease come back to us! It's not the same without you.\n\nCheers,\nThe Task Manager Team`,
    });
};

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail,
};
