const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pool = require('../config/db');

dotenv.config();

module.exports = async (req, res, next) => {
    const { token, email } = req.query;

    if (!token || !email) {
        return res.status(400).json({ error: 'Token and email are required' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Decode the email address
        const decodedEmail = decodeURIComponent(email);

        // Construct the full URL as it would be stored in the database
        const registrationLink = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        // Fetch the registration link from the database
        const query = 'SELECT * FROM temporary_users WHERE registration_link = $1 AND email = $2';
        const values = [registrationLink, decodedEmail];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            // Add debugging logs to help trace the issue
            console.error('Debug Info: Registration link not found in the database.');
            console.error('Expected link:', registrationLink);
            console.error('Email:', decodedEmail);
            return res.status(401).json({ error: 'Link not found in the database or email does not match' });
        }

        const registrationRequest = result.rows[0];
        const now = new Date();

        if (now > new Date(registrationRequest.expires_at)) {
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            console.log(`Expired registration link for ${decodedEmail} deleted from database.`);
            return res.status(401).json({ error: 'Link invalid or expired' });
        }

        req.decodedToken = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            console.log(`Expired registration link for ${decodedEmail} deleted from database.`);
            return res.status(401).json({ error: 'Link invalid or expired' });
        } else {
            console.error('Error verifying token or deleting expired link:', error);
            return res.status(401).json({ error: 'Link invalid or expired' });
        }
    }
};
