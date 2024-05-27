const pool = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const url = require('url');

const { sendRegistrationEmail } = require('../utils/emailSender');
const { generateRegistrationLink } = require('../utils/jwtHelper');

// Helper function to check if email exists in the database
async function checkIfEmailExists(email) {
    // console.log('Executing checkIfEmailExists function');
    const queryTemp = 'SELECT * FROM temporary_users WHERE email = $1';
    const queryUsers = 'SELECT * FROM users WHERE email = $1';
    const values = [email];

    try {
        const tempResult = await pool.query(queryTemp, values);
        if (tempResult.rowCount > 0) {
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
    // console.log('Executing getRegistrationByEmail function');
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
    // console.log('Executing saveRegistration function');
    const query = `
        INSERT INTO temporary_users (email, registration_link)
        VALUES ($1, $2)
    `;
    const values = [email, token];

    try {
        await pool.query(query, values);
    } catch (error) {
        console.error('Error saving registration:', error);
        throw error;
    }
};

// Exported function to send registration link
exports.sendRegistrationLink = async (req, res) => {
    // console.log('Executing sendRegistrationLink function');
    const { email } = req.body;
    const registrationLink = generateRegistrationLink(email);

    try {
        const emailExists = await checkIfEmailExists(email);
        if (emailExists.exists) {
            return res.status(409).send('Email already exists');
        }

        await sendRegistrationEmail(email, registrationLink);
        await saveRegistration(email, registrationLink);
        res.status(200).json({ msg: 'Email sent' });
    } catch (error) {
        console.error('Error sending email or saving registration:', error);
        res.status(500).send('Error sending email');
    }
};

// Exported function to resend registration link
exports.resendRegistrationLink = async (req, res) => {
    // console.log('Executing resendRegistrationLink function');
    const { email } = req.body;

    try {
        const registration = await getRegistrationByEmail(email);
        if (!registration) {
            return res.status(404).send('Email not found');
        }

        await sendRegistrationEmail(email, registration.registration_link);
        res.status(200).send('Email resent');
    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).send('Error resending email');
    }
};

// Exported function to permanently register user
exports.registerUser = async (req, res) => {
    // console.log('Executing registerUser function');
    const { dob, name, password, surname } = req.body;
    const { query } = url.parse(req.url, true);
    const email = query.email;

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (dob, email, name, password, surname)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, submitted_at;
        `;
        const values = [dob, email, name, hashedPassword, surname];
        const result = await pool.query(query, values);

        const { id, submitted_at } = result.rows[0];

        await pool.query('DELETE FROM temporary_users WHERE email = $1', [email]);

        res.status(200).json({ message: 'User registered successfully', id, submitted_at });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
};
