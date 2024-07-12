
This Node.js application provides user authentication and management features, including registration, login, password recovery, and email verification. It leverages PostgreSQL for database storage, JWT for secure authentication tokens, and NodeMailer for email communication. Currently, the application focuses on essential user management operations, with plans for expanding its functionality in the future.

## Table of Contents

1. [Architecture](#architecture)
2. [Folder Structure](#folder-structure)
3. [Environment Variables](#environment-variables)
5. [Usage](#usage)
6. [Endpoints](#endpoints)
7. [File Explanations](#file-explanations)

## Architecture

The project adopts a modular architecture, organizing functionalities into separate files and directories. Below is a brief overview of the main components:

- **Database Configuration**: Manages PostgreSQL database connections and configurations.
- **Controllers**: Contains logic for handling various HTTP requests and generating responses.
- **Middlewares**: Provides reusable functions to intercept and process HTTP requests.
- **Routes**: Defines the application's API endpoints and connects them to corresponding controllers.
- **Utilities**: Houses helper functions for common tasks such as email sending and JWT token management.

## Folder Structure

root/ <br />
│ <br />
├── config/ <br />
│ └── db.js <br />
├── controllers/ <br />
│ ├── credentialsRecoveryController.js <br />
│ ├── loginController.js <br />
│ └── registrationController.js <br />
├── middleware/ <br />
│ ├── loginMiddleware.js <br />
│ ├── verifyLoginToken.js <br />
│ ├── verifyPasswordResetToken.js <br />
│ └── verifyRegistrationToken.js <br />
├── routes/ <br />
│ ├── loginRouter.js <br /> 
│ ├── recoveryRouter.js <br />
│ └── registerRouter.js <br />
├── utils/ <br />
│ ├── emailSender.js <br />
│ └── jwtHelper.js <br />
└── index.js <br />

## Environment Variables

The application relies on environment variables for configuration. Ensure these variables are set in a `.env` file at the root of the project:

PGHOST=<your_postgresql_host> <br />
PGPORT=<your_postgresql_port> <br />
PGDATABASE=<your_postgresql_database> <br />
PGUSER=<your_postgresql_user> <br />
PGPASSWORD=<your_postgresql_password> <br />
JWT_SECRET=<your_jwt_secret> <br />
EMAIL_USER=<your_email_address> <br />
EMAIL_PASS=<your_email_password> <br />
SMTP_HOST=<your_smtp_host> <br />
SMTP_PORT=<your_smtp_port> <br />
SMTP_SECURE=<true_or_false_based_on_your_smtp> <br />
BASE_URL=<your_base_url> <br />

## Usage

- **Registration**: Users can register by providing their email and other details. They will receive a registration link via email.
- **Login**: Users can log in with their email and password.
- **Password Recovery**: Users can request a password reset link if they forget their password.
- **Email Verification**: Users need to verify their email address using a link sent to their email.

## Endpoints

### Registration Routes

- `POST /api/auth/registration-link`: Sends a registration link to the user's email.
- `POST /api/auth/resend-registration-link`: Resends the registration link to the user's email.
- `POST /api/auth/register`: Registers a user using the verification link.

### Login Routes

- `POST /api/auth/login`: Logs in a user.

### Password Recovery Routes

- `POST /api/auth/recover-email`: Recovers a forgotten email address.
- `POST /api/auth/send-reset-password-link`: Sends a password reset link.
- `POST /api/auth/resend-reset-password-link`: Resends the password reset link.
- `POST /api/auth/reset-password`: Resets the user's password.

## File Explanations

### `config/db.js`

- **Purpose**: Manages the configuration and connection to the PostgreSQL database.
- **Functionality**: Sets up a connection pool to PostgreSQL using environment variables for host, port, database name, username, and password. Handles database connection errors.

### `controllers/credentialsRecoveryController.js`

- **Purpose**: Handles endpoints related to credentials recovery (email recovery and password reset).
- **Functionality**: Contains functions for recovering an email address, sending a password reset link, resending a password reset link, and resetting a user's password. Uses the `pool` from `db.js` for database queries and `bcrypt` for password hashing.

### `controllers/loginController.js`

- **Purpose**: Handles user login functionality.
- **Functionality**: Exports a single function `loginUser` that sends a JWT token response upon successful login. Receives user credentials from `loginMiddleware` and utilizes `jwt` for token signing.

### `controllers/registrationController.js`

- **Purpose**: Manages user registration endpoints.
- **Functionality**: Provides endpoints to send a registration link, resend a registration link, and register a user. Uses `verifyRegistrationToken` middleware for token verification and `jwtHelper` for generating registration links.

### `middleware/loginMiddleware.js`

- **Purpose**: Middleware for validating user credentials during login.
- **Functionality**: Checks user credentials against the database using `bcrypt` for password comparison. Signs a JWT token upon successful login and attaches user information to the request object.

### `middleware/verifyLoginToken.js`

- **Purpose**: Middleware to verify JWT tokens during user login.
- **Functionality**: Verifies the JWT token extracted from the request header using `jwt.verify`. If valid, attaches decoded user information to the request object (`req.user`) for further processing.

### `middleware/verifyPasswordResetToken.js`

- **Purpose**: Middleware to verify JWT tokens during password reset.
- **Functionality**: Verifies the JWT token extracted from the request query parameters (`token` and `email`). Checks if the token exists in the `password_reset_requests` table and hasn't expired.

### `middleware/verifyRegistrationToken.js`

- **Purpose**: Middleware to verify JWT tokens during user registration.
- **Functionality**: Verifies the JWT token extracted from the request query parameters (`token` and `email`). Checks if the token exists in the `temporary_users` table and hasn't expired.

### `routes/loginRouter.js`

- **Purpose**: Defines routes related to user login.
- **Functionality**: Imports `loginMiddleware` and `loginController` to handle the `/login` POST endpoint for user authentication.

### `routes/recoveryRouter.js`

- **Purpose**: Defines routes for credential recovery and password reset.
- **Functionality**: Imports functions from `credentialsRecoveryController` and `verifyPasswordResetToken` middleware to handle endpoints related to email recovery and password reset.

### `routes/registerRouter.js`

- **Purpose**: Defines routes for user registration.
- **Functionality**: Imports functions from `registrationController` and `verifyRegistrationToken` middleware to handle endpoints related to user registration, including sending registration links and registering users.

### `utils/emailSender.js`

- **Purpose**: Provides helper functions for sending emails.
- **Functionality**: Contains functions `sendRegistrationEmail`, `sendResetPasswordEmail`, and `sendPasswordChangedEmail` using `nodemailer` to send registration links, password reset links, and password changed confirmation emails respectively.

### `utils/jwtHelper.js`

- **Purpose**: Provides helper functions for JWT token operations.
- **Functionality**: Contains functions `generateRegistrationLink` and `generatePasswordResetLink` to generate JWT tokens with expiration for registration and password reset links respectively.

### `index.js`

- **Purpose**: Entry point of the application where the Express server is configured.
- **Functionality**: Sets up the Express server, imports middleware, routes, and starts listening on a specified port (`process.env.PORT` or default `8080`).
