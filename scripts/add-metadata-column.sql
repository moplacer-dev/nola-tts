-- Add metadata JSONB column to component_templates table
-- For multi-component smart placement (e.g., L!L Startup → 3 consecutive lessons)

ALTER TABLE component_templates
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_component_templates_metadata ON component_templates USING gin(metadata);

-- Comment for documentation
COMMENT ON COLUMN component_templates.metadata IS 'JSON metadata for multi-component placement. Example: {"is_multi": true, "sub_components": [{"title": "Lesson 1", "duration": 1}]}';
