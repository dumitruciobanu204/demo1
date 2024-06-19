const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { sendResetPasswordEmail, sendPasswordChangedEmail } = require('../utils/emailSender');
const { generatePasswordResetLink } = require('../utils/jwtHelper');

// Helper function to clean up expired records from the password_reset_requests table
async function cleanUpExpiredRecords() {
    const now = new Date();
    const query = 'DELETE FROM password_reset_requests WHERE expires_at < $1';
    const values = [now];

    try {
        await pool.query(query, values);
    } catch (error) {
        console.error('Error cleaning up expired records:', error);
        throw error;
    }
};

// Helper function to mask email
function maskEmail(email) {
    const atIndex = email.indexOf('@');
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex);

    const firstTwoChars = localPart.substring(0, 3);
    const lastTwoChars = localPart.substring(localPart.length - 2);

    let maskedPart = firstTwoChars;
    for (let i = 0; i < 9; i++) {
        maskedPart += '*';
    }
    maskedPart += lastTwoChars;

    return maskedPart + domain;
};

// Exported function to recover email address based on provided name, surname, and dob
exports.recoverEmail = async (req, res) => {
    const { name, surname, dob } = req.body;

    try {
        const query = 'SELECT email FROM users WHERE name = $1 AND surname = $2 AND dob = $3';
        const values = [name, surname, dob];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userEmail = result.rows[0].email;
        const maskedEmail = maskEmail(userEmail);

        res.status(200).json({ maskedEmail });
    } catch (error) {
        console.error('Error recovering email address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Function to handle password reset request
exports.resetPasswordLink = async (req, res) => {
    const { email, name, surname, dob } = req.body;

    try {
        await cleanUpExpiredRecords();

        const query = 'SELECT * FROM users WHERE email = $1 AND name = $2 AND surname = $3 AND dob = $4';
        const values = [email, name, surname, dob];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if there's already a reset request for this email
        const checkQuery = 'SELECT * FROM password_reset_requests WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);

        if (checkResult.rowCount > 0) {
            const resetRequest = checkResult.rows[0];
            const now = new Date();
            if (now > new Date(resetRequest.expires_at)) {
                await pool.query('DELETE FROM password_reset_requests WHERE email = $1', [email]);
            } else {
                return res.status(200).json({ message: 'Password reset link already sent' });
            }
        }

        const resetLink = generatePasswordResetLink(email);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        // Insert the new reset request
        const insertQuery = 'INSERT INTO password_reset_requests (email, reset_link, expires_at) VALUES ($1, $2, $3)';
        await pool.query(insertQuery, [email, resetLink, expiresAt]);

        // Send the reset password email
        await sendResetPasswordEmail(email, resetLink);

        res.status(200).json({ message: 'Password reset link sent' });
    } catch (error) {
        console.error('Error handling password reset request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Function to resend password reset link
exports.resendResetPasswordLink = async (req, res) => {
    const { email, name, surname, dob } = req.body;

    try {
        await cleanUpExpiredRecords();

        const query = 'SELECT * FROM users WHERE email = $1 AND name = $2 AND surname = $3 AND dob = $4';
        const values = [email, name, surname, dob];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetLink = generatePasswordResetLink(email);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        // Delete existing reset request
        const deleteQuery = 'DELETE FROM password_reset_requests WHERE email = $1';
        await pool.query(deleteQuery, [email]);

        // Insert the new reset request
        const insertQuery = 'INSERT INTO password_reset_requests (email, reset_link, expires_at) VALUES ($1, $2, $3)';
        await pool.query(insertQuery, [email, resetLink, expiresAt]);

        // Send the reset password email
        await sendResetPasswordEmail(email, resetLink);

        res.status(200).json({ message: 'Password reset link resent' });
    } catch (error) {
        console.error('Error resending password reset link:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Function to reset user password
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Check if the email exists in the database
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2';
        await pool.query(updateQuery, [hashedPassword, email]);

        // Delete the entry from password_reset_requests table
        const deleteQuery = 'DELETE FROM password_reset_requests WHERE email = $1';
        await pool.query(deleteQuery, [email]);

        // Send email notification
        try {
            await sendPasswordChangedEmail(email);
            res.status(200).json({ message: 'Password reset successfully' });
        } catch (emailError) {
            console.error('Error sending password changed email:', emailError);
            res.status(500).json({ message: 'Error sending password changed email' });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
