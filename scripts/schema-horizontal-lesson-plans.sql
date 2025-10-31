-- Horizontal Lesson Plan Schema
-- Streamlined approach: Templates only, no data copying

-- Main HLP Documents Table
CREATE TABLE IF NOT EXISTS horizontal_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_name VARCHAR(255) NOT NULL,
  teacher_name VARCHAR(255) NOT NULL,
  school_year VARCHAR(100) NOT NULL,  -- e.g., "2024-2025", "2025-2026"
  subject VARCHAR(100) NOT NULL,  -- e.g., "Science", "Math"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_hlp_user ON horizontal_lesson_plans(user_id);

-- HLP Module Library Table (for pre-populated modules)
-- This stores reusable module templates that users can select from
CREATE TABLE IF NOT EXISTS hlp_module_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(50),  -- e.g., "Science", "Math"
  grade_level VARCHAR(10),  -- e.g., "7", "8", or NULL for all grades
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_hlp_module_templates_active ON hlp_module_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_hlp_module_templates_subject ON hlp_module_templates(subject);

-- HLP Module Template Sessions Table
-- Stores the 7 session templates for each module template
CREATE TABLE IF NOT EXISTS hlp_template_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES hlp_module_templates(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL CHECK (session_number BETWEEN 1 AND 7),
  focus TEXT NOT NULL,
  objectives TEXT NOT NULL,
  materials TEXT,
  teacher_prep TEXT,
  assessments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, session_number)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_hlp_template_sessions_template ON hlp_template_sessions(template_id);

-- HLP Module Template Enrichments Table
-- Stores enrichment activities for each module template
CREATE TABLE IF NOT EXISTS hlp_template_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES hlp_module_templates(id) ON DELETE CASCADE,
  enrichment_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, enrichment_number)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_hlp_template_enrichments_template ON hlp_template_enrichments(template_id);

-- HLP Selected Modules Table (join table - references templates only, up to 10)
CREATE TABLE IF NOT EXISTS hlp_selected_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hlp_id UUID NOT NULL REFERENCES horizontal_lesson_plans(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES hlp_module_templates(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hlp_id, module_number)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_hlp_selected_modules_hlp ON hlp_selected_modules(hlp_id);
CREATE INDEX IF NOT EXISTS idx_hlp_selected_modules_template ON hlp_selected_modules(template_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hlp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to HLP tables
CREATE TRIGGER update_hlp_timestamp
  BEFORE UPDATE ON horizontal_lesson_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_hlp_updated_at();

CREATE TRIGGER update_hlp_module_templates_timestamp
  BEFORE UPDATE ON hlp_module_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_hlp_updated_at();

CREATE TRIGGER update_hlp_template_sessions_timestamp
  BEFORE UPDATE ON hlp_template_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_hlp_updated_at();
