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

        // Construct the reset link using the BASE_URL environment variable
        const resetLink = `${process.env.BASE_URL}${req.originalUrl}`;

        const query = 'SELECT * FROM password_reset_requests WHERE reset_link = $1 AND email = $2';
        const values = [resetLink, email];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Link not found in the database or email does not match' });
        }

        const resetRequest = result.rows[0];
        const now = new Date();
        if (now > new Date(resetRequest.expires_at)) {
            await pool.query('DELETE FROM password_reset_requests WHERE email = $1', [email]);
            return res.status(401).json({ error: 'Link invalid or expired' });
        }

        req.decodedToken = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Link invalid or expired' });
    }
};
