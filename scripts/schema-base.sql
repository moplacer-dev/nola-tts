-- Base Schema for NOLA.ess Application
-- Run this FIRST before other schema files
-- Creates fundamental tables: users, pacing_guides

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'ess');
CREATE TYPE grade_level AS ENUM ('7', '8');

-- Users Table
-- Stores admin and ESS user accounts
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'ess',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups (used during login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Pacing Guides Table
-- Main container for each user's pacing guide
-- One pacing guide contains 5 calendars (base + 4 subjects)
CREATE TABLE IF NOT EXISTS pacing_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_name VARCHAR(255) NOT NULL,
  district_name VARCHAR(255) NOT NULL,
  grade_level grade_level NOT NULL,
  first_day DATE NOT NULL,
  last_day DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_pacing_guides_user_id ON pacing_guides(user_id);
