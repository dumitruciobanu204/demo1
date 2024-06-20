const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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

        // Construct the full URL as stored in the database
        const registrationLink = `${process.env.BASE_URL}${req.originalUrl.split('?')[0]}?token=${token}&email=${encodeURIComponent(decodedEmail)}`;

        // Log the constructed registrationLink
        console.log(`Constructed registrationLink: ${registrationLink}`);

        // Log the email and token being used for the query
        console.log(`Email: ${decodedEmail}`);
        console.log(`Token: ${token}`);

        // Fetch the registration link from the database
        const query = 'SELECT * FROM temporary_users WHERE email = $1';
        const emailValues = [decodedEmail];

        // Log the query and values
        console.log(`Email Query: ${query}`);
        console.log(`Email Values: ${JSON.stringify(emailValues)}`);

        const emailResult = await pool.query(query, emailValues);

        // Log the query results
        console.log(`Email Query result: ${JSON.stringify(emailResult.rows)}`);

        if (emailResult.rowCount === 0) {
            console.log(`No record found for ${decodedEmail}`);
            return res.status(401).json({
                error: 'Email not found in the database',
                decodedEmail // Temporary: Include the decoded email in the response for debugging
            });
        }

        const registrationQuery = 'SELECT * FROM temporary_users WHERE registration_link = $1 AND email = $2';
        const registrationValues = [registrationLink, decodedEmail];

        // Log the query and values
        console.log(`Registration Query: ${registrationQuery}`);
        console.log(`Registration Values: ${JSON.stringify(registrationValues)}`);

        const registrationResult = await pool.query(registrationQuery, registrationValues);

        // Log the query results
        console.log(`Registration Query result: ${JSON.stringify(registrationResult.rows)}`);

        if (registrationResult.rowCount === 0) {
            console.log(`No record found for ${decodedEmail} with token ${token}`);
            return res.status(401).json({
                error: 'Link not found in the database or email does not match',
                registrationLink, // Temporary: Include the constructed link in the response for debugging
                queryResult: registrationResult.rows, // Temporary: Include the query result in the response for debugging
                decodedEmail // Temporary: Include the decoded email in the response for debugging
            });
        }

        const registrationRequest = registrationResult.rows[0];
        const now = new Date();

        if (now > new Date(registrationRequest.expires_at)) {
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            console.log(`Expired registration link for ${decodedEmail} deleted from database.`);
            return res.status(401).json({
                error: 'Link invalid or expired',
                registrationLink, // Temporary: Include the constructed link in the response for debugging
                queryResult: registrationResult.rows, // Temporary: Include the query result in the response for debugging
                decodedEmail // Temporary: Include the decoded email in the response for debugging
            });
        }

        req.registration = { decoded, registrationRequest };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const decodedEmail = decodeURIComponent(email); // Decode the email again in case of an error
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            console.log(`Expired registration link for ${decodedEmail} deleted from database.`);
            return res.status(401).json({
                error: 'Link invalid or expired',
                registrationLink, // Temporary: Include the constructed link in the response for debugging
                queryResult: registrationResult ? registrationResult.rows : [], // Temporary: Include the query result in the response for debugging
                decodedEmail // Temporary: Include the decoded email in the response for debugging
            });
        } else {
            console.error('Error verifying token or deleting expired link:', error);
            return res.status(401).json({
                error: 'Link invalid or expired',
                registrationLink, // Temporary: Include the constructed link in the response for debugging
                queryResult: registrationResult ? registrationResult.rows : [], // Temporary: Include the query result in the response for debugging
                decodedEmail // Temporary: Include the decoded email in the response for debugging
            });
        }
    }
};
