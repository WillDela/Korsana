-- Separate table for AI coach rate limits.
-- Stored in PostgreSQL as an authoritative, tamper-resistant second layer
-- behind the Redis fast-path. CHECK constraints enforce the daily cap at
-- the database level, so the limit holds even if Redis is bypassed.

CREATE TABLE IF NOT EXISTS coach_rate_limits (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE        NOT NULL DEFAULT CURRENT_DATE,
    used_count  INTEGER     NOT NULL DEFAULT 0,
    daily_limit INTEGER     NOT NULL DEFAULT 10,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date),
    CONSTRAINT used_count_non_negative  CHECK (used_count >= 0),
    CONSTRAINT used_count_within_limit  CHECK (used_count <= daily_limit)
);

CREATE INDEX IF NOT EXISTS idx_coach_rate_limits_user_date
    ON coach_rate_limits (user_id, date);

-- Atomically consume one quota unit for a user on a given date.
-- Returns the new used_count on success, or NULL when the limit is reached.
-- The FOR UPDATE lock prevents double-spending under concurrent requests.
CREATE OR REPLACE FUNCTION try_consume_coach_quota(
    p_user_id UUID,
    p_date    DATE
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_used  INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT used_count, daily_limit
      INTO v_used, v_limit
      FROM coach_rate_limits
     WHERE user_id = p_user_id AND date = p_date
       FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO coach_rate_limits (user_id, date, used_count, daily_limit)
             VALUES (p_user_id, p_date, 1, 10)
          RETURNING used_count INTO v_used;
        RETURN v_used;
    END IF;

    IF v_used >= v_limit THEN
        RETURN NULL;
    END IF;

    UPDATE coach_rate_limits
       SET used_count = used_count + 1,
           updated_at = NOW()
     WHERE user_id = p_user_id AND date = p_date
     RETURNING used_count INTO v_used;

    RETURN v_used;
END;
$$;

-- Read-only quota status — does not increment.
CREATE OR REPLACE FUNCTION get_coach_quota(
    p_user_id UUID,
    p_date    DATE
) RETURNS TABLE (used INTEGER, limit_val INTEGER)
LANGUAGE sql
AS $$
    SELECT used_count, daily_limit
      FROM coach_rate_limits
     WHERE user_id = p_user_id AND date = p_date
    UNION ALL
    SELECT 0, 10
     WHERE NOT EXISTS (
         SELECT 1 FROM coach_rate_limits
          WHERE user_id = p_user_id AND date = p_date
     );
$$;
