const pool = require('../config/db');
const bcrypt = require('bcrypt');
const url = require('url');

const { sendRegistrationEmail } = require('../utils/emailSender');
const { generateRegistrationLink } = require('../utils/jwtHelper');

// Helper function to clean up expired records from the temporary_users table
async function cleanUpExpiredRecords() {
    const now = new Date();
    const query = 'DELETE FROM temporary_users WHERE expires_at < $1';
    const values = [now];

    try {
        await pool.query(query, values);
    } catch (error) {
        console.error('Error cleaning up expired records:', error);
        throw error;
    }
};

// Helper function to check if email exists in the database
async function checkIfEmailExists(email) {
    const queryTemp = 'SELECT * FROM temporary_users WHERE email = $1';
    const queryUsers = 'SELECT * FROM users WHERE email = $1';
    const values = [email];

    try {
        const tempResult = await pool.query(queryTemp, values);
        if (tempResult.rowCount > 0) {
            const registration = tempResult.rows[0];
            const now = new Date();
            if (now > new Date(registration.expires_at)) {
                await pool.query('DELETE FROM temporary_users WHERE email = $1', [email]);
                return { exists: false, expired: true };
            }
            return { exists: true, location: 'temporary_users' };
        }

        const usersResult = await pool.query(queryUsers, values);
        if (usersResult.rowCount > 0) {
            return { exists: true, location: 'users' };
        }

        return { exists: false };
    } catch (error) {
        console.error('Error checking email existence:', error);
        throw error;
    }
};

// Helper function to get registration details by email
async function getRegistrationByEmail(email) {
    const query = 'SELECT * FROM temporary_users WHERE email = $1';
    const values = [email];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching temporary_users by email:', error);
        throw error;
    }
};

// Helper function to save registration to the temporary_users table
async function saveRegistration(email, token) {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 3 minutes from now
    const query = `
        INSERT INTO temporary_users (email, registration_link, expires_at)
        VALUES ($1, $2, $3)
    `;
    const values = [email, token, expiresAt];

    try {
        await pool.query(query, values);
    } catch (error) {
        console.error('Error saving registration:', error);
        throw error;
    }
};

// Exported function to send registration link
exports.sendRegistrationLink = async (req, res) => {
    const { email } = req.body;
    const registrationLink = generateRegistrationLink(email);

    try {
        // Clean up expired records before processing the current request
        await cleanUpExpiredRecords();

        const emailExists = await checkIfEmailExists(email);
        if (emailExists.exists) {
            if (emailExists.location === 'temporary_users') {
                return res.status(409).send('Email already exists. Please check your email for the registration link.');
            } else if (emailExists.location === 'users') {
                return res.status(409).send('An account with this email already exists.');
            }
        }

        await sendRegistrationEmail(email, registrationLink);
        await saveRegistration(email, registrationLink);
        res.status(200).send('Email sent');
    } catch (error) {
        console.error('Error sending email or saving registration:', error);
        res.status(500).send('Error sending email');
    }
};

// Exported function to resend registration link
exports.resendRegistrationLink = async (req, res) => {
    const { email } = req.body;
    const decodedEmail = decodeURIComponent(email);  // Decode the email

    try {
        const registration = await getRegistrationByEmail(decodedEmail);
        if (!registration) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const now = new Date();
        if (now > new Date(registration.expires_at)) {
            await pool.query('DELETE FROM temporary_users WHERE email = $1', [decodedEmail]);
            return res.status(401).json({ error: 'Link invalid or expired' });
        }

        await sendRegistrationEmail(decodedEmail, registration.registration_link);
        res.status(200).json({ message: 'Email resent' });
    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({ error: 'Error resending email' });
    }
};

// Exported function to permanently register user
exports.registerUser = async (req, res) => {
    const { dob, name, password, surname } = req.body;
    const { decoded, registrationRequest } = req.registration; // Extract decoded token and registration request

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `
            INSERT INTO users (dob, email, name, password, surname)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, submitted_at;
        `;
        const values = [dob, decoded.email, name, hashedPassword, surname];
        const result = await pool.query(insertQuery, values);

        const { id, submitted_at } = result.rows[0];

        // Delete the registration entry from temporary_users table after successful registration
        await pool.query('DELETE FROM temporary_users WHERE email = $1', [decoded.email]);

        res.status(200).json({ message: 'User registered successfully', id, submitted_at });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
};
