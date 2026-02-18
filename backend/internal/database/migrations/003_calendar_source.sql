-- Add source column to training_calendar
ALTER TABLE training_calendar
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
