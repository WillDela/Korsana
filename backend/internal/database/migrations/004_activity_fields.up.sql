-- Add additional activity fields from Strava
ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS average_cadence FLOAT,
    ADD COLUMN IF NOT EXISTS suffer_score INTEGER,
    ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER;

-- Add longest_run and total_runs to weekly_summaries
ALTER TABLE weekly_summaries
    ADD COLUMN IF NOT EXISTS longest_run_meters FLOAT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
