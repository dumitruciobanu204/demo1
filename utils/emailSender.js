const nodeMailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Transporter config
const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Helper function to send registration email
async function sendRegistrationEmail(email, registrationLink) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verification Link',
        text: `Complete your registration using the link: ${registrationLink}`
    };

    return transporter.sendMail(mailOptions);
};

// Helper function to send reset password email
async function sendResetPasswordEmail(email, resetLink) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Link',
        text: `You have requested a password reset. Use the following link to reset your password: ${resetLink}`
    };

    return transporter.sendMail(mailOptions);
};

// Helper function to send password changed confirmation email
async function sendPasswordChangedEmail(email) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Changed Successfully',
        text: 'Your password has been changed successfully.'
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendRegistrationEmail, sendResetPasswordEmail, sendPasswordChangedEmail };
