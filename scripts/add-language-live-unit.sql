-- Add Language! Live Unit component
INSERT INTO component_templates (
  component_key,
  subject,
  display_name,
  default_duration_days,
  color,
  description,
  metadata,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ela_language_live_unit',
  'ela',
  'Language! Live Unit (Lessons 1-10)',
  22,
  '#DC2626',
  'Complete Language!Live unit with 10 lessons (2 days each) and 2 data conferences',
  '{
    "is_multi": true,
    "sub_components": [
      {"title": "L!L Unit #, L1\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L1\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L2\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L2\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #\nGroup 1: WT\nGroup 2: WT\nData Conference", "duration": 1},
      {"title": "L!L Unit #, L3\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L3\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L4\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L4\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L5\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L5\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #\nGroup 1: WT\nGroup 2: WT\nData Conference", "duration": 1},
      {"title": "L!L Unit #, L6\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L6\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L7\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L7\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L8\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L8\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L9\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L9\nGroup 1: WT\nGroup 2: TT", "duration": 1},
      {"title": "L!L Unit #, L10\nGroup 1: TT\nGroup 2: WT", "duration": 1},
      {"title": "L!L Unit #, L10\nGroup 1: WT\nGroup 2: TT", "duration": 1}
    ]
  }'::jsonb,
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
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Verify the insert
SELECT
  component_key,
  display_name,
  default_duration_days,
  color,
  subject
FROM component_templates
WHERE component_key = 'ela_language_live_unit';
