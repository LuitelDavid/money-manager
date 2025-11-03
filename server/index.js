require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api', authRoutes);
app.use('/api', transactionRoutes);

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Access the app at:`);
  console.log(`  - Signup: http://localhost:${PORT}/signup.html`);
  console.log(`  - Login: http://localhost:${PORT}/login.html`);
  console.log(`  - Dashboard: http://localhost:${PORT}/dashboard.html`);
});