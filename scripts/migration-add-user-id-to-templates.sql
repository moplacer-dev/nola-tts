-- Migration: Add user_id column to component_templates table
-- Adds support for user-created custom components
-- NULL = system template (visible to all users)
-- UUID = custom template (visible only to creator)

-- Add user_id column (nullable for system templates)
ALTER TABLE component_templates
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add index for faster filtering by user
CREATE INDEX IF NOT EXISTS idx_component_templates_user ON component_templates(user_id);

-- Add comment to document the column
COMMENT ON COLUMN component_templates.user_id IS 'NULL for system templates, UUID for user-created custom templates';
