-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
  id VARCHAR(50) PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  entry_type VARCHAR(20) NOT NULL,
  analysis JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_name ON entries(user_name);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(entry_type);
