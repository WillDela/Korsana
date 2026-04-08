-- Migration: adapt public.users to Supabase Auth
--
-- Supabase owns authentication. Users are created in auth.users.
-- public.users must mirror auth.users via a trigger so all foreign
-- keys (race_goals, activities, etc.) resolve correctly.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor).

-- 1. Drop password_hash — auth is now handled entirely by Supabase.
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Function: insert a public.users row whenever a Supabase auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on auth.users INSERT.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Function + trigger: delete public.users row when auth.users row is deleted.
--    This keeps the mirror consistent when deletions happen outside the app
--    (e.g. Supabase dashboard or admin scripts).
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();
