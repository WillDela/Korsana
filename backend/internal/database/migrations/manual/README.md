# Manual migrations

Migrations in this directory are **not** picked up by `cmd/migrate`. They
must be applied by hand through the Supabase SQL editor because they touch
the `auth.` schema, which Supabase locks down from external connections.

## How to apply

1. Open the Supabase dashboard for the project.
2. Go to **SQL Editor → New query**.
3. Paste the entire contents of the migration file.
4. Click **Run**.
5. Verify no errors in the output panel.

## Files

- `013_supabase_auth.sql` — creates the `auth.users → public.users` sync
  trigger so a row inserted by Supabase Auth automatically appears in
  `public.users`. Required before any user can sign up.
