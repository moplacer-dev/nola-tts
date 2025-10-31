-- Add display_order column to scheduled_components table
-- This allows users to reorder components within the same cell

-- Step 1: Add the column (nullable first) - column may already exist
ALTER TABLE scheduled_components
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Step 2: Set initial display_order values based on current ID order
-- Group by subject_calendar_id and start_date, then assign sequential order
WITH ranked_components AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY subject_calendar_id, start_date
      ORDER BY id ASC
    ) as new_order
  FROM scheduled_components
  WHERE display_order IS NULL
)
UPDATE scheduled_components sc
SET display_order = rc.new_order
FROM ranked_components rc
WHERE sc.id = rc.id;

-- Step 3: For any components that already have display_order, ensure no gaps
WITH ranked_components AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY subject_calendar_id, start_date
      ORDER BY COALESCE(display_order, 999999), id ASC
    ) as new_order
  FROM scheduled_components
)
UPDATE scheduled_components sc
SET display_order = rc.new_order
FROM ranked_components rc
WHERE sc.id = rc.id;

-- Step 4: Make the column NOT NULL with default
ALTER TABLE scheduled_components
ALTER COLUMN display_order SET NOT NULL,
ALTER COLUMN display_order SET DEFAULT 1;

-- Step 5: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_components_display_order
ON scheduled_components(subject_calendar_id, start_date, display_order);

-- Verify the changes
SELECT
  sc.id,
  sc.subject_calendar_id,
  pg.school_name,
  sc.start_date,
  sc.title_override,
  sc.display_order
FROM scheduled_components sc
JOIN subject_calendars scs ON sc.subject_calendar_id = scs.id
JOIN pacing_guides pg ON scs.pacing_guide_id = pg.id
ORDER BY sc.subject_calendar_id, sc.start_date, sc.display_order
LIMIT 20;
