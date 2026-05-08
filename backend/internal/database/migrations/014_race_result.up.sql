-- Add race result fields to race_goals
ALTER TABLE race_goals
  ADD COLUMN IF NOT EXISTS result_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS is_pr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
