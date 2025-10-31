-- Update "Establish Rules & Procedures" to "Establish Rapport & Classroom Procedures"
UPDATE component_templates
SET
  display_name = 'Establish Rapport & Classroom Procedures',
  description = 'Establish classroom rapport and procedures',
  updated_at = NOW()
WHERE component_key IN (
  'ela_rules_procedures',
  'math_rules_procedures',
  'science_rules_procedures',
  'ss_rules_procedures'
);

-- Add Flex Day component for ELA
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
  'ela_flex_day',
  'ela',
  'Flex Day',
  1,
  '#8B5CF6',
  'Flexible ELA instruction day',
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

-- Add Flex Day component for Science
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
  'science_flex_day',
  'science',
  'Flex Day',
  1,
  '#8B5CF6',
  'Flexible science instruction day',
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

-- Verify the updates
SELECT
  component_key,
  subject,
  display_name,
  color
FROM component_templates
WHERE
  component_key LIKE '%rules_procedures'
  OR component_key LIKE '%flex_day'
ORDER BY subject, component_key;
