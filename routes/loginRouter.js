const express = require('express');
const router = express.Router();
const loginMiddleware = require('../middleware/loginMiddleware');
const { loginUser } = require('../controllers/loginController');

// Login Route at '/login'
router.post('/login', loginMiddleware, loginUser);

module.exports = router;
