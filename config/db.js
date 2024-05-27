const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

<<<<<<< HEAD
=======
const expiryTime = process.env.JWT_LIFE_SPAN;

const deleteExpiredRecords = async () => {
    const currentTime = new Date();
    const expiryTimestamp = new Date(currentTime - expiryTime);

    const client = await pool.connect();

    const queryParams = [expiryTimestamp.toISOString()];

    try {
        // Delete from temporary_users
        const deleteTemporaryUsersQuery = 'DELETE FROM temporary_users WHERE created_at <= $1';
        await client.query(deleteTemporaryUsersQuery, queryParams);
    
        // Delete from password_reset_requests
        const deletePasswordResetRequestsQuery = 'DELETE FROM password_reset_requests WHERE created_at <= $1';
        await client.query(deletePasswordResetRequestsQuery, queryParams);
    
        console.log(`${currentTime} - Expired records deleted successfully`);

    } catch (error) {
        console.error('Error deleting expired records:', error);
    } finally {
        client.release();
    }
};

const deletionCheckInterval = process.env.JWT_DELETION_CHECK_INTERVAL;
setInterval(deleteExpiredRecords, deletionCheckInterval);

>>>>>>> 3c1ef7f895d3aa91deb12d45296e69cdffd69d15
module.exports = pool;
