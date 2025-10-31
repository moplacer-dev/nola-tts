-- Calendar Events Table
-- Stores events that appear on the Base Calendar and sync to all subject calendars
-- These are separate from reusable component templates

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pacing_guide_id UUID NOT NULL REFERENCES pacing_guides(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  duration_days INTEGER DEFAULT 1 CHECK (duration_days > 0),
  event_type VARCHAR(50),
  is_base_event BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_guide ON calendar_events(pacing_guide_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date);

-- Subject Calendars Table
-- One entry for each of the 5 calendars (Base, ELA, Math, Science, Social Studies)
CREATE TABLE IF NOT EXISTS subject_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pacing_guide_id UUID NOT NULL REFERENCES pacing_guides(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL CHECK (subject IN ('base', 'ela', 'math', 'science', 'social_studies')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pacing_guide_id, subject)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_subject_calendars_guide ON subject_calendars(pacing_guide_id);

-- Scheduled Components Table
-- Stores curriculum component instances placed on subject calendars
-- These reference component templates but have their own dates/durations
CREATE TABLE IF NOT EXISTS scheduled_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_calendar_id UUID NOT NULL REFERENCES subject_calendars(id) ON DELETE CASCADE,
  component_key VARCHAR(100) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  duration_days INTEGER DEFAULT 1 CHECK (duration_days > 0),
  title_override TEXT,
  "order" INTEGER DEFAULT 0, -- DEPRECATED: Use display_order instead
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 1, -- Added 2025-10-30: Controls display order within same cell
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_components_calendar ON scheduled_components(subject_calendar_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_components_dates ON scheduled_components(start_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_components_display_order ON scheduled_components(subject_calendar_id, start_date, display_order); -- Added 2025-10-30
