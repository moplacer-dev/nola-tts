-- Update all base calendar component templates to use uniform color #232323
-- This makes base calendar events visually distinct from curriculum components

UPDATE component_templates
SET color = '#232323'
WHERE subject = 'base';

-- Verify the update
SELECT
  component_key,
  display_name,
  color,
  subject
FROM component_templates
WHERE subject = 'base'
ORDER BY component_key;
