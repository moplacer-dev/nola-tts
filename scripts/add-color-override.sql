-- Add color_override column to scheduled_components table
-- Allows users to customize component colors on a per-instance basis

ALTER TABLE scheduled_components
ADD COLUMN IF NOT EXISTS color_override VARCHAR(7);

-- Color should be a valid hex color code (e.g., #9333EA)
-- Nullable - if null, use the color from the component template
