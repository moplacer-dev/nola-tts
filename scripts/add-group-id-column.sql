-- Migration: Add group_id column to scheduled_components
-- Date: 2025-10-03
-- Purpose: Link multi-component sessions together (e.g., Module Rotation with 7 sessions)
--          Allows bulk updating rotation numbers across all sessions in a group

-- Add group_id column
ALTER TABLE scheduled_components
ADD COLUMN IF NOT EXISTS group_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_components_group_id
ON scheduled_components(group_id);

-- Comments
COMMENT ON COLUMN scheduled_components.group_id IS
'Links multi-component sessions together. When set, all components with the same group_id belong to a single multi-component placement (e.g., Module Rotation R#, S1-S7). Used for bulk updates of rotation numbers.';
