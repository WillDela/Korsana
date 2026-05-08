-- Groups coach messages into discrete sessions so the sidebar can show
-- per-conversation history instead of one flat message stream.

CREATE TABLE IF NOT EXISTS coach_sessions (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(120) NOT NULL DEFAULT 'New session',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_sessions_user
    ON coach_sessions (user_id, created_at DESC);

-- Add session_id to existing messages table (nullable for backward compat)
ALTER TABLE coach_conversations
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES coach_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_coach_conversations_session
    ON coach_conversations (session_id, created_at ASC);
