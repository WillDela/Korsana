-- Migration 017: Add summary column to coach_sessions
-- Run this in the Supabase SQL Editor

ALTER TABLE coach_sessions
  ADD COLUMN IF NOT EXISTS summary TEXT;
