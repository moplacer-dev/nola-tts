-- Add IPL Orientation component for Math
INSERT INTO component_templates (
  component_key,
  subject,
  display_name,
  default_duration_days,
  color,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  'math_ipl_orientation',
  'math',
  'IPL Orientation',
  1,
  '#8B5CF6',
  'IPL program orientation for beginning of year',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (component_key) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  default_duration_days = EXCLUDED.default_duration_days,
  color = EXCLUDED.color,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the insert
SELECT
  component_key,
  display_name,
  default_duration_days,
  color,
  subject
FROM component_templates
WHERE component_key = 'math_ipl_orientation';
