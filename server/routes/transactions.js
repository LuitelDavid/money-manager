const express = require('express');
const pool = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get All Transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, amount, type, reason, balance_after, created_at FROM TRANSACTION WHERE user_id = $1 ORDER BY created_at DESC, id DESC',
      [userId]
    );

    res.json({
      transactions: result.rows
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});

// Add New Transaction
router.post('/transactions', authenticateToken, async (req, res) => {
  const { amount, type, reason } = req.body;
  const userId = req.user.userId;

  try {
    // Validate inputs
    if (!amount || !type || !reason) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!['expense', 'credit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "expense" or "credit"' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get last balance
      const lastBalanceResult = await client.query(
        'SELECT balance_after FROM TRANSACTION WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1',
        [userId]
      );

      let currentBalance = 0;
      if (lastBalanceResult.rows.length > 0) {
        currentBalance = parseFloat(lastBalanceResult.rows[0].balance_after);
      }

      // Calculate new balance
      let newBalance;
      if (type === 'expense') {
        newBalance = currentBalance - parseFloat(amount);
        if (newBalance < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Insufficient balance' });
        }
      } else {
        newBalance = currentBalance + parseFloat(amount);
      }

      // Insert transaction
      const result = await client.query(
        'INSERT INTO TRANSACTION (user_id, amount, type, reason, balance_after) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, amount, type, reason, newBalance]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Transaction added successfully',
        transaction: result.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Server error adding transaction' });
  }
});

module.exports = router;