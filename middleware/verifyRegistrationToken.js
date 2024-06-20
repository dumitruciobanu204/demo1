const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
    const { token, email } = req.query;

    if (!token || !email) {
        return res.status(400).json({ code: 'TOKEN_EMAIL_REQUIRED', message: 'Token and email are required' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Decode the email address
        const decodedEmail = decodeURIComponent(email);

        // Construct the full URL as stored in the database
        const registrationLink = `${process.env.BASE_URL}${req.originalUrl.split('?')[0]}?token=${token}&email=${encodeURIComponent(decodedEmail)}`;

        // Fetch the registration link from the database
        const emailQuery = 'SELECT * FROM temporary_users WHERE email = $1';
        const emailValues = [decodedEmail];
        const emailResult = await pool.query(emailQuery, emailValues);

        if (emailResult.rowCount === 0) {
            return res.status(401).json({ code: 'EMAIL_NOT_FOUND', message: 'Email not found in the database' });
        }

        const registrationQuery = 'SELECT * FROM temporary_users WHERE registration_link = $1 AND email = $2';
        const registrationValues = [registrationLink, decodedEmail];
        const registrationResult = await pool.query(registrationQuery, registrationValues);

        if (registrationResult.rowCount === 0) {
            return res.status(401).json({ code: 'LINK_NOT_FOUND', message: 'Link not found in the database or email does not match' });
        }

        const registrationRequest = registrationResult.rows[0];
        const now = new Date();

        if (now > new Date(registrationRequest.expires_at)) {
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            return res.status(401).json({ code: 'LINK_EXPIRED', message: 'Link invalid or expired' });
        }

        req.registration = { decoded, registrationRequest };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const decodedEmail = decodeURIComponent(email); // Decode the email again in case of an error
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Link invalid or expired' });
        } else {
            console.error('Error verifying token or deleting expired link:', error);
            return res.status(401).json({ code: 'SERVER_ERROR', message: 'An error occurred while processing the request' });
        }
    }
};
