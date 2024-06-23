const express = require('express');
const router = express.Router();
const { recoverEmail, resetPasswordLink, resendResetPasswordLink, resetPassword } = require('../controllers/credentialsRecoveryController');
const verifyPasswordResetToken = require('../middleware/verifyPasswordResetToken');

// Endpoint to recover forgotten login/email address
router.post('/recover-email', recoverEmail);

// Endpoint to send password reset link
router.post('/send-reset-password-link', resetPasswordLink);

// Endpoint to resend password reset link
router.post('/resend-reset-password-link', resendResetPasswordLink);

// Endpoint to reset password
router.post('/reset-password', verifyPasswordResetToken, resetPassword);

module.exports = router;
