const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Middleware
const verifyRegistrationToken = require('./middleware/verifyRegistrationToken');
const verifyPasswordResetToken = require('./middleware/verifyPasswordResetToken');
const loginMiddleware = require('./middleware/loginMiddleware');

// Controllers
const { sendRegistrationLink, resendRegistrationLink, registerUser } = require('./controllers/registrationController');
const { loginUser } = require('./controllers/loginController');
const { recoverEmail, resetPasswordLink, resendResetPasswordLink, resetPassword} = require('./controllers/credentialsRecoveryController');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://moldova-six.vercel.app'); // Origin-ul tău
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(cors());

// Endpoint to send a registration link to the user's email.
app.post('/registration-link', sendRegistrationLink);

// Endpoint to resend the registration link to the user's email.
app.post('/resend-registration-link', resendRegistrationLink);

// Endpoint to register a user.
app.post('/register', verifyRegistrationToken, registerUser);

// Endpoint to log in a user.
app.post('/login', loginMiddleware, loginUser);

// Endpoint to recover forgotten login/email address
app.post('/recover-email', recoverEmail);

// Endpoint to send password reset link
app.post('/send-reset-password-link', resetPasswordLink);

// Endpoint to resend password reset link
app.post('/resend-reset-password-link', resendResetPasswordLink);

// Ednpoint to reset password
app.post('/reset-password', verifyPasswordResetToken, resetPassword);

// 
app.get('/users', (req, res) => {
    res.json({ msg: 'qweqwe' });
});

app.listen(PORT, () => {
    console.log(`app on port ${PORT}`);
});