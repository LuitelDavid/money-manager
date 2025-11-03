-- Create database (run this separately in psql)
-- CREATE DATABASE money_manager;

-- Connect to the database
-- \c money_manager

-- Create USER_DETAILS table
CREATE TABLE IF NOT EXISTS USER_DETAILS (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  dob DATE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create TRANSACTION table
CREATE TABLE IF NOT EXISTS TRANSACTION (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES USER_DETAILS(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type VARCHAR(10) NOT NULL, -- 'expense' or 'credit'
  reason VARCHAR(50) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON TRANSACTION(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON TRANSACTION(created_at DESC);