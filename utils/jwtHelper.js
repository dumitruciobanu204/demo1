const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// GET base URL from .env variable
const BASE_URL = process.env.BASE_URL;

// Helper function to generate registration link
function generateRegistrationLink(email) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    return `${BASE_URL}/api/auth/register?token=${token}&email=${encodeURIComponent(email)}`;
};

// Helper function to generate password reset link
function generatePasswordResetLink(email) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    return `${BASE_URL}/api/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
};

module.exports = { generateRegistrationLink, generatePasswordResetLink };
