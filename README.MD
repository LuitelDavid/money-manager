Money Manager — README.md

A simple, secure money-management web application built with Node.js + Express, PostgreSQL, and vanilla HTML/CSS/JS.
Allows users to sign up, log in, add transactions (expense / credit), and view a running transaction history with balance tracking.

🎯 Project Summary

This repository implements a full-stack money-management app with:

Secure authentication (bcrypt + JWT)

Transaction tracking with balance_after stored for each transaction

Clean, responsive frontend (signup, login, dashboard)

REST API endpoints for auth and transactions

Example SQL schema and DB init script

The UI is built using plain HTML/CSS/JS (no frameworks) so you can easily extend or port it to React/Vue later.

✅ Key Features

Sign up & login with hashed passwords

JWT-based session handling

Add Expense or Credit transactions

Real-time calculation of balance stored in each transaction (balance_after)

Transaction history listing (with timestamps)

Frontend pages: signup.html, login.html, dashboard.html

Input validation & error messages

Mobile-responsive UI

🚀 Quick Start (Local Development)
Prerequisites

Node.js (v14+)

PostgreSQL (v12+)

npm

1. Clone & Install
git clone <git clone <https://github.com/LuitelDavid/money-manager>>
cd money-manager
npm install

2. Create PostgreSQL Database

Open psql or your DB tool and Use the server/db/init.sql script to create the necessary schema.

3. Environment Variables

Create a .env file (root) and fill in your values:

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=yourpassword
PG_DATABASE=money_manager
JWT_SECRET=some_long_random_secret_here
PORT=3000

4. Run the app
# Start production server
npm start
# OR start with auto-reload in development
npm run dev


Open your browser: http://localhost:3000/signup.html

📁 Project Structure
money-manager/
│
├── server/
│   ├── index.js                 # Main server file (Express)
│   ├── routes/
│   │   ├── auth.js              # Signup / login routes
│   │   └── transactions.js      # Add & fetch transactions
│   ├── db/
│   │   ├── connection.js        # PostgreSQL connection helper
│   │   └── init.sql             # DB schema / initialization SQL
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   └── .env                     # (not committed) environment variables template
│
├── public/
│   ├── signup.html              # Signup page (frontend)
│   ├── login.html               # Login page
│   ├── dashboard.html           # Dashboard (transactions UI)
│   ├── style.css                # App styling
│   └── script.js                # dashboard interactivity (frontend-only JS)
│
├── package.json
└── README.md

🔌 API Endpoints (summary)

All authenticated endpoints require an Authorization: Bearer <JWT> header.

POST /api/signup
Create a new user. (Accepts name, email, password, optional dob, address, and optional initial balance handling logic.)

POST /api/login
Login with email and password. Returns JWT.

GET /api/me
Return basic user info (name, id, email) and current balance (calculated from last transaction balance_after).

GET /api/transactions
Get logged-in user's transaction history (sorted by created_at desc).

POST /api/transactions
Create a new transaction: { amount, type: "expense" | "credit", reason }. Server calculates balance_after based on most recent transaction for the user and returns the created transaction record.

🔐 Security & Validation

Passwords hashed with bcrypt

JWT-based protected routes — token verified by middleware/auth.js

Parameterized SQL queries to avoid SQL injection

Input validation on both frontend and backend (ensure amount > 0, valid type, non-empty reason, etc.)

ON DELETE CASCADE ensures transactions are removed if the user is deleted

💡 Implementation Notes & Decisions

Balance storage: Instead of storing balance on the USER_DETAILS table, the app persists balance_after in each transaction row. The current balance is fetched from the most recent transaction (ORDER BY created_at DESC LIMIT 1).

Initial balance: Consider creating an Initial Balance credit transaction when a user signs up (if you want users to start with an initial amount).

Transaction Types: Stored in type as 'expense' or 'credit'. The server uses this to compute new balance_after:

new_balance = previous_balance - amount (for expense)

new_balance = previous_balance + amount (for credit)

Thank you 