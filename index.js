const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Routers
const registerRouter = require('./routes/registerRouter'); // Register router
const loginRouter = require('./routes/loginRouter'); // Login router
const recoveryRouter = require('./routes/recoveryRouter'); // Credentials recovery router

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://moldova-six.vercel.app'); // Origin-ul tău
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(cors());

// Use routes
app.use('/api/auth', registerRouter);  // Registration routes
app.use('/api/auth', loginRouter); // Login routes
app.use('/api/auth', recoveryRouter); // Credentials recovery routes

app.listen(PORT, () => {
    console.log(`app on port ${PORT}`);
});
