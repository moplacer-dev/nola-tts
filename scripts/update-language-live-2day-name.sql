-- Update the 2-day Language Live Unit name to clarify it's the 2-day version
UPDATE component_templates
SET
  display_name = 'Language! Live Unit (Lessons 1-10, 2 Days)',
  description = 'Complete Language!Live unit with 10 lessons (2 days each) and 2 data conferences',
  updated_at = NOW()
WHERE component_key = 'ela_language_live_unit';

-- Verify the update
SELECT
  component_key,
  display_name,
  default_duration_days,
  description
FROM component_templates
WHERE component_key IN ('ela_language_live_unit', 'ela_language_live_unit_single')
ORDER BY default_duration_days DESC;
