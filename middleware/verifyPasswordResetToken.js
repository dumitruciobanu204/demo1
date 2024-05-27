const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pool = require('../config/db');

dotenv.config();

module.exports = async (req, res, next) => {
    const { token, email } = req.query;

    // console.log(token);
    // console.log(email);

    if (!token || !email) {
        return res.status(400).json({ error: 'Token and email are required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const query = 'SELECT * FROM password_reset_requests WHERE reset_link = $1 AND email = $2';
        const values = [`${req.protocol}://${req.get('host')}${req.originalUrl}`, email];
        const result = await pool.query(query, values);

        // console.log('Query Result:', result.rows);

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Link not found in the database or email does not match' });
        }

        req.decodedToken = decoded;

        // res.locals.email = email;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Link invalid or expired' });
    }
};
