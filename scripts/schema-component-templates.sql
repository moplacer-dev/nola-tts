-- Component Templates Table
-- Stores reusable curriculum component templates for each subject

CREATE TABLE IF NOT EXISTS component_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_key VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(50) NOT NULL CHECK (subject IN ('base', 'ela', 'math', 'science', 'social_studies')),
  display_name VARCHAR(255) NOT NULL,
  default_duration_days INTEGER DEFAULT 1 CHECK (default_duration_days > 0),
  color VARCHAR(7) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_component_templates_subject ON component_templates(subject);
CREATE INDEX IF NOT EXISTS idx_component_templates_active ON component_templates(is_active);
