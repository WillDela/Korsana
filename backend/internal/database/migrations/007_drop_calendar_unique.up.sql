-- Drop the UNIQUE(user_id, date) constraint to allow multiple entries per day.
-- The existing idx_training_calendar_user_date index covers query performance.
ALTER TABLE training_calendar DROP CONSTRAINT IF EXISTS training_calendar_user_id_date_key;
