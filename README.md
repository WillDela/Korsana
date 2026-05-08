# Korsana

> AI-powered marathon training. Connect Strava, set a race goal, and get a
> personalized coaching loop that adapts to your real activity data.

**Production:** [korsana.run](https://korsana.run)

For product, architecture, and design-system context see
[`extras/CLAUDE.md`](extras/CLAUDE.md). The improvement backlog and audit
findings live in [`extras/audit-and-improvement-plan.md`](extras/audit-and-improvement-plan.md).

---

## Tech stack

| Layer    | Tooling                                              |
|----------|------------------------------------------------------|
| Frontend | React 19 + Vite + TailwindCSS v4 + Framer Motion (JSX) |
| Backend  | Go 1.24 + Gin                                        |
| Database | PostgreSQL via Supabase                              |
| Auth     | Supabase Auth (JWT validated by backend middleware)  |
| Cache    | Redis (Upstash in prod, local Redis in dev)          |
| AI       | Google Gemini 2.0 Flash (Claude as fallback)         |
| Hosting  | Frontend → Vercel · Backend → DigitalOcean App Platform |

---

## Repository layout

```
backend/
  cmd/server/             API server entrypoint
  cmd/migrate/            Database migration runner
  internal/api/           Handlers + middleware
  internal/config/        Env-var loading and validation
  internal/database/      DB connection + migration files
  internal/services/      Business logic
  Dockerfile              Multi-target: server (default) and migrate
  docker-compose.yml      db + redis + migrate + api for local dev

frontend/
  src/pages/              Route components
  src/components/         UI primitives + feature components
  src/api/                Axios client + per-domain modules
  src/lib/                chartTheme, motion variants, workoutStatus

extras/                   Project context (CLAUDE.md, audit plan, etc.)
.github/workflows/        CI: backend, frontend, security
```

---

## Required environment variables

The backend validates required variables at startup and refuses to boot if
any are missing — see `backend/internal/config/config.go`.

### Backend (`backend/.env`)

| Variable                      | Required                | Notes                                                 |
|-------------------------------|-------------------------|-------------------------------------------------------|
| `DATABASE_URL`                | yes                     | Supabase pooler URL, session mode (port 5432)         |
| `SUPABASE_URL`                | yes                     | Settings → API → Project URL                           |
| `SUPABASE_SERVICE_ROLE_KEY`   | yes                     | Settings → API → service_role. Keep secret             |
| `STRAVA_CLIENT_ID`            | yes                     | Strava API app                                        |
| `STRAVA_CLIENT_SECRET`        | yes                     | Strava API app                                        |
| `GEMINI_API_KEY`              | one of these            | Gemini is the active provider                         |
| `CLAUDE_API_KEY`              | one of these            | Retained as fallback                                  |
| `STRAVA_REDIRECT_URI`         | optional (has default)  | Defaults to `http://localhost:8080/api/strava/callback` |
| `FRONTEND_URL`                | optional (has default)  | Used in OAuth redirects and email links               |
| `ALLOWED_ORIGINS`             | optional (has default)  | Comma-separated; each validated as http/https URL     |
| `REDIS_URL`                   | optional (has default)  | Defaults to `redis://localhost:6379`                  |
| `PORT`                        | optional (has default)  | Defaults to `8080`                                    |
| `ENVIRONMENT`                 | optional (has default)  | `development` or `production`                         |
| `SMTP_*`                      | optional                | Leave blank to disable email notifications            |

See `backend/.env.example` for the full template with comments.

### Frontend (`frontend/.env`)

| Variable                  | Required | Notes                                |
|---------------------------|----------|--------------------------------------|
| `VITE_API_URL`            | yes      | e.g. `https://api.korsana.run/api`   |
| `VITE_SUPABASE_URL`       | yes      | Same project URL as backend          |
| `VITE_SUPABASE_ANON_KEY`  | yes      | Settings → API → anon (public) key   |

---

## First-time Supabase setup

1. Create a Supabase project at [app.supabase.com](https://app.supabase.com).
2. Copy `Project URL`, `anon` key, and `service_role` key from
   **Settings → API**. Paste them into the appropriate `.env` files.
3. Copy the **Connection pooler — Session mode** URI from
   **Settings → Database** into `DATABASE_URL`. Use port `5432`, not 6543
   — `lib/pq` requires session-mode pooling for prepared statements.
4. Apply migration 013 manually (it touches the `auth` schema and Supabase
   blocks the standard migration flow from doing this):
   - Open **SQL Editor → New query**
   - Paste the contents of
     `backend/internal/database/migrations/manual/013_supabase_auth.sql`
   - Run. This creates the `auth.users → public.users` sync trigger.
5. Apply the rest of the migrations: see [Database migrations](#database-migrations).

---

## Local development

### Prerequisites

- Go 1.24+
- Node.js 22 LTS
- Docker Desktop (only if you want the compose stack)
- A Supabase project for auth and storage

### Option A — docker-compose (full stack in one command)

```bash
cd backend
cp .env.example .env       # then fill in real values
docker compose up --build
```

This brings up Postgres, Redis, runs `cmd/migrate` once, then starts the
API. The API will be at `http://localhost:8080`. Health check:
`curl http://localhost:8080/health`.

> **Local-dev gotcha:** the local Postgres in compose has no `auth` schema,
> so signup flows that depend on migration 013 won't work. For features
> that exercise auth, point `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
> at a Supabase sandbox project even when running against the local DB.

### Option B — direct (Go + Node, no compose)

```bash
# Backend
cd backend
cp .env.example .env       # then fill in real values
go mod download
go run ./cmd/migrate       # apply pending migrations
go run ./cmd/server        # listens on :8080
```

```bash
# Frontend (separate terminal)
cd frontend
cp .env.example .env       # then fill in real values
npm install
npm run dev                # http://localhost:5173
```

The frontend Vite dev server proxies `/api/*` to `localhost:8080`.

---

## Database migrations

Migrations live in `backend/internal/database/migrations/` as
`NNN_description.up.sql` files and are embedded into the migrate binary at
build time.

```bash
cd backend
go run ./cmd/migrate
```

The runner is **idempotent** — re-running with no new migrations is a
no-op. It tracks applied versions in the `schema_migrations` table.

### Adding a new migration

1. Create `backend/internal/database/migrations/NNN_description.up.sql`
   where `NNN` is the next sequential number.
2. Run `go run ./cmd/migrate` against your local DB to apply it.
3. Commit. CI will rebuild the migrate binary with the new file embedded.

### Manual migrations

Files in `backend/internal/database/migrations/manual/` are **not** picked
up by `cmd/migrate` — they touch the `auth` schema, which Supabase locks
down from external connections. Apply them by hand via the Supabase SQL
editor. See `backend/internal/database/migrations/manual/README.md`.

### Production sync (one-time, only if migrating an existing DB)

If you're switching an existing production DB to the new runner, seed the
`schema_migrations` table once via the Supabase SQL editor so the runner
doesn't try to re-apply everything:

```sql
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version bigint  NOT NULL PRIMARY KEY,
    dirty   boolean NOT NULL
);
INSERT INTO public.schema_migrations (version, dirty)
VALUES (19, false) ON CONFLICT (version) DO NOTHING;
```

Replace `19` with the highest migration number already applied.

---

## Testing and lint

### Backend

```bash
cd backend
go test ./...              # all tests
go test ./... -race        # with race detector (CI runs this)
go vet ./...
gofmt -l .                 # exits non-zero if anything is unformatted
```

### Frontend

```bash
cd frontend
npm run test               # vitest
npm run lint               # eslint (currently ~289 known errors, see below)
npm run build              # vite production build
```

> **Known**: the frontend has a backlog of ~289 unused-import lint errors
> from before the audit. CI runs lint as advisory (`continue-on-error`) and
> these are scheduled for a dedicated cleanup PR.

### Pre-commit hooks (optional)

The repo ships a `.pre-commit-config.yaml` with file hygiene, gitleaks,
and local Go hooks. To activate:

```bash
pip install prek           # or pipx install prek
prek install               # registers the git hook
prek run --all-files       # one-time check
```

CI runs the same checks (gitleaks, go vet, build, test) on every PR, so
local prek is genuinely optional.

---

## Continuous integration

Three workflows under `.github/workflows/`:

| Workflow      | Triggers                              | What it runs                          |
|---------------|---------------------------------------|---------------------------------------|
| `backend.yml` | push/PR on `backend/**`               | gofmt verify, go vet, build, race-test |
| `frontend.yml`| push/PR on `frontend/**`              | npm ci, lint (advisory), build, test  |
| `security.yml`| every push/PR + Mondays 06:00 UTC     | gitleaks scan, zizmor workflow audit  |

All actions are SHA-pinned with version comments. Workflows use
`contents: read` permissions and `persist-credentials: false` on every
checkout.

---

## Deployment

### Frontend (Vercel)

`korsana.run` is a Vercel project with the build directory set to
`frontend/`. Vercel auto-deploys on every push to `main`. Environment
variables are configured in the Vercel dashboard.

### Backend (DigitalOcean App Platform)

Builds from `backend/Dockerfile` (default `server` target). Environment
variables are configured in DO App Platform → Settings → App-Level
Environment Variables. Every variable in the
[Required environment variables](#required-environment-variables) table
must be set, or the new startup validator will refuse to boot.

---

## Backup and restore

### Backups

Supabase takes **daily automatic backups** of the database. Retention
depends on your plan tier — confirm current retention at
**Database → Backups** in the Supabase dashboard.

For higher-stakes recovery, enable **Point-in-Time Recovery (PITR)** on
the Supabase Pro plan. PITR lets you restore to any second within the
retention window rather than to a daily snapshot.

### Restore

1. Open **Database → Backups** in the Supabase dashboard.
2. Pick a snapshot or PITR timestamp.
3. Click **Restore**. Supabase prompts for confirmation; the operation
   replaces the current database in place — there is no undo.
4. After restore, verify:
   - `select count(*) from auth.users;` returns the expected user count.
   - `select max(version) from public.schema_migrations;` returns the
     expected schema version.
   - The migrate runner against the restored DB reports
     "Database already up to date".

### Drill cadence

Restore drills are easy to put off and impossible to do well during an
incident. Run a quarterly drill against a non-production Supabase project:

1. Restore yesterday's snapshot into a fresh project.
2. Point a local backend at the restored DB.
3. Confirm the app boots, signups work, and Strava sync still applies.
4. Tear the project down.

If anything fails the drill, treat it as an incident — fix it before the
real one happens.

---

## License

MIT

---

*Built for the Miami Marathon 2026.*
