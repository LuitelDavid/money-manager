const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, dob, address, initialBalance } = req.body;

  try {
    // Validate inputs
    if (!name || !email || !password || !initialBalance) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (initialBalance < 0) {
      return res.status(400).json({ error: 'Initial balance cannot be negative' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM USER_DETAILS WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert user
      const userResult = await client.query(
        'INSERT INTO USER_DETAILS (name, email, password_hash, dob, address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, email, passwordHash, dob || null, address || null]
      );

      const userId = userResult.rows[0].id;

      // Create initial balance transaction
      await client.query(
        'INSERT INTO TRANSACTION (user_id, amount, type, reason, balance_after) VALUES ($1, $2, $3, $4, $5)',
        [userId, initialBalance, 'credit', 'Initial Balance', initialBalance]
      );

      await client.query('COMMIT');

      res.status(201).json({ 
        message: 'User created successfully',
        userId: userId 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM USER_DETAILS WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get User Info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const userResult = await pool.query(
      'SELECT id, name, email, dob, address, created_at FROM USER_DETAILS WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current balance (from last transaction)
    const balanceResult = await pool.query(
      'SELECT balance_after FROM TRANSACTION WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1',
      [userId]
    );

    const currentBalance = balanceResult.rows.length > 0 
      ? parseFloat(balanceResult.rows[0].balance_after)
      : 0;

    res.json({
      user: userResult.rows[0],
      currentBalance: currentBalance
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
});

module.exports = router;