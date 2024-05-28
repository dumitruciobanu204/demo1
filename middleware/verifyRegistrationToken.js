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
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

        const query = 'SELECT * FROM temporary_users WHERE registration_link = $1 AND email = $2';
        const values = [token, email];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Link not found in the database or email does not match' });
        }

        const record = result.rows[0];
        const now = new Date();
        const expiresAt = new Date(record.expires_at);

        if (expiresAt < now) {
            await pool.query('DELETE FROM temporary_users WHERE registration_link = $1 AND email = $2', values);
            return res.status(401).json({ error: 'Link has expired and has been removed' });
        }

        req.decodedToken = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            await pool.query('DELETE FROM temporary_users WHERE registration_link = $1 AND email = $2', [token, email]);
            return res.status(401).json({ error: 'Link expired and has been removed' });
        }
        res.status(401).json({ error: 'Link invalid or expired' });
    }
};
