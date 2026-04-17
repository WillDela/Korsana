-- Migration 018: Add coach_state JSONB to users
-- Stores per-user coach continuity data: flagged concerns from prior sessions.
-- Run this in the Supabase SQL Editor.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS coach_state JSONB DEFAULT '{}';
