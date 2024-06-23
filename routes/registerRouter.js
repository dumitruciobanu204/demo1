const express = require('express');
const router = express.Router();
const { sendRegistrationLink, resendRegistrationLink, registerUser } = require('../controllers/registrationController');
const verifyRegistrationToken = require('../middleware/verifyRegistrationToken');

// Endpoint to send a registration link to the user's email.
router.post('/registration-link', sendRegistrationLink);

// Endpoint to resend the registration link to the user's email.
router.post('/resend-registration-link', resendRegistrationLink);

// Endpoint to register a user.
router.post('/register', verifyRegistrationToken, registerUser);

module.exports = router;
