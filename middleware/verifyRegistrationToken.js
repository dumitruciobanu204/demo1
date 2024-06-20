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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const query = 'SELECT * FROM temporary_users WHERE registration_link = $1 AND email = $2';
        const values = [`${req.protocol}://${req.get('host')}${req.originalUrl}`, email];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Link not found in the database or email does not match' });
        }

        const registrationRequest = result.rows[0];
        const now = new Date();

        if (now > new Date(registrationRequest.expires_at)) {
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [email]);
            console.log(`Expired registration link for ${email} deleted from database.`);
            return res.status(401).json({ error: 'Link invalid or expired' });
        }

        req.decodedToken = decoded;
        next();
    } catch (error) {
        console.error('Error verifying token or deleting expired link:', error);
        res.status(401).json({ error: 'Link invalid or expired' });
    }
};
