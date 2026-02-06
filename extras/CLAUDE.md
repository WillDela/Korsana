# CLAUDE.md — Korsana Project Instructions

> **Purpose:** This file provides context and continuity instructions for any Claude instance (Claude.ai, Claude Code, or API) working on the Korsana project. Read this first before doing any work.

---

## Project Identity

- **Name:** Korsana
- **Type:** AI-powered running coaching platform
- **Mission:** "Korsana is an AI-powered coaching platform that analyzes a runner's unified training data to create and adapt a personalized plan for their specific race goals."
- **Builder:** William — CS student at FIU, Panthers Run Club president, training for Miami Marathon

---

## Key Files to Read

| File | Purpose |
|------|---------|
| `CLAUDE.md` | You're here. Project instructions + progress tracker. |
| `context.md` | Full project context: vision, decisions, tech stack, design system, competitive landscape. |
| `plan.md` | Step-by-step MVP execution plan with milestones and task checklists. |
| `README.md` | Public-facing project documentation (once created). |

**Always read `context.md` and `plan.md` before starting any new work session.** They are the source of truth.

---

## Tech Stack

- **Backend:** Golang (Gin framework)
- **Frontend:** React + TypeScript (Vite) + TailwindCSS
- **Database:** PostgreSQL (Railway)
- **Cache:** Redis (Railway)
- **AI:** Google Gemini API and/or Anthropic Claude API (evaluate both)
- **External APIs:** Strava API (MVP), Garmin + Coros (Phase 2)
- **Deployment:** Vercel (frontend) + Railway (backend, Postgres, Redis)

---

## Development Guidelines

### Code Style & Structure
- **Backend (Go + Gin):** Follow standard Go project layout (`/cmd`, `/internal`, `/pkg`, `/api`)
- **Frontend (React):** Feature-based folder structure under `/src`
  - `/components` — reusable UI components
  - `/pages` — route-level page components
  - `/hooks` — custom React hooks
  - `/api` — API client functions
  - `/lib` — utilities, constants, types
- Use TypeScript for all frontend code
- Use TailwindCSS for styling — follow the "Athletic Precision" design system defined in `context.md`

### Design System Quick Reference (Blue-Green Vibe)
- **Deep Green (bg/text):** `#13230B`
- **Deep Blue (primary):** `#242E7B`
- **Sage Green (secondary):** `#618B4A`
- **Cream (surfaces):** `#EEF5DB`
- **Slate (muted):** `#465362`
- **Data/Numbers font:** IBM Plex Mono
- **UI font:** Inter
- **Philosophy:** Data-dense, purposeful color, no decoration for decoration's sake
- **Coaching approach:** Always hybrid — established training principles + AI personalization. Never generic linear plans.

### API Design
- RESTful endpoints under `/api/` prefix
- JWT or session-based auth (decision to be documented)
- Consistent JSON response format:
  ```json
  {
    "data": { ... },
    "error": null
  }
  ```
- Meaningful HTTP status codes
- Input validation on both frontend and backend

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Reference milestone when relevant: `feat(M2): implement Strava OAuth callback`

---

## Working Principles

1. **Check progress first.** Before starting work, check the Progress Tracker below to know where things stand.
2. **Follow the plan.** Work through milestones in order. Each builds on the last.
3. **MVP only.** If a feature isn't in `plan.md` Milestones 0-6, it waits. Don't scope creep.
4. **Document decisions.** When making a technical choice (framework, library, pattern), note the decision and reasoning.
5. **Test with real data.** William's actual Strava data is the test case. The app should work for his Miami Marathon training.
6. **Update progress.** After completing any task or milestone, update the Progress Tracker below.

---

## Progress Tracker

> **Instructions:** After completing a task, change `[ ]` to `[x]` and add the date. After completing a milestone, update its status. This is how we maintain continuity across sessions.

### Overall Status

| Milestone | Status | Started | Completed |
|-----------|--------|---------|-----------|
| M0: Project Scaffolding | 🔲 Not Started | — | — |
| M1: User Authentication | 🔲 Not Started | — | — |
| M2: Strava OAuth | 🔲 Not Started | — | — |
| M3: Race Goal Setup | 🔲 Not Started | — | — |
| M4: Dashboard | 🔲 Not Started | — | — |
| M5: AI Coach | 🔲 Not Started | — | — |
| M6: Polish & Deploy | 🔲 Not Started | — | — |

**Status legend:** 🔲 Not Started | 🟡 In Progress | ✅ Complete | ⏸️ Blocked

---

### M0: Project Scaffolding
- [ ] GitHub repo created
- [ ] Golang backend initialized
- [ ] React frontend initialized
- [ ] TailwindCSS configured
- [ ] Docker Compose for local DB (optional)
- [ ] Basic CORS + health check working
- [ ] README written
- [ ] First commit pushed

**Notes / Decisions:**
> _(Record any decisions made during this milestone here)_

---

### M1: User Authentication
- [ ] `users` table migration
- [ ] Register endpoint
- [ ] Login endpoint
- [ ] JWT/session middleware
- [ ] Auth me endpoint
- [ ] Logout endpoint
- [ ] Frontend: Sign up page
- [ ] Frontend: Login page
- [ ] Frontend: Auth state management
- [ ] Frontend: Protected routes
- [ ] Frontend: App shell/layout

**Notes / Decisions:**
> _(e.g., "Chose JWT over sessions because..." or "Using bcrypt with cost factor 12")_

---

### M2: Strava OAuth Integration
- [ ] Strava API application registered
- [ ] OAuth connect endpoint
- [ ] OAuth callback endpoint
- [ ] Token storage (DB)
- [ ] Token refresh logic
- [ ] `activities` table migration
- [ ] Activity sync endpoint
- [ ] Frontend: Connect Strava button
- [ ] Frontend: OAuth callback handling
- [ ] Frontend: Activities list view

**Notes / Decisions:**
> _

---

### M3: Race Goal Setup
- [ ] `race_goals` table migration
- [ ] CRUD endpoints for goals
- [ ] Computed metrics on goal response
- [ ] Frontend: Goal-setting form/flow
- [ ] Frontend: Active goal display
- [ ] Frontend: Goal management (edit/delete)

**Notes / Decisions:**
> _

---

### M4: Race Readiness Dashboard
- [ ] Dashboard data aggregation endpoint
- [ ] Countdown calculation
- [ ] Weekly mileage computation
- [ ] Pace analysis computation
- [ ] Planned mileage logic (decision needed)
- [ ] Frontend: Goal context header
- [ ] Frontend: Countdown widget
- [ ] Frontend: Weekly mileage chart
- [ ] Frontend: Pace comparison display
- [ ] Frontend: Mileage trend chart
- [ ] Frontend: Recent runs list
- [ ] Mobile responsive

**Notes / Decisions:**
> _

---

### M5: AI Coach Chat
- [ ] OpenAI API integration
- [ ] `coach_conversations` table migration
- [ ] Chat message endpoint
- [ ] Context builder (goal + activities → prompt)
- [ ] System prompt crafted
- [ ] Token management
- [ ] Frontend: Chat interface
- [ ] Frontend: Message history
- [ ] Frontend: Loading/typing indicator
- [ ] Frontend: Conversation management

**Notes / Decisions:**
> _

---

### M6: Polish, Deploy & Document
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Production database configured
- [ ] Custom domain set up
- [ ] Strava OAuth configured for production
- [ ] Mobile responsiveness audit
- [ ] Error handling pass
- [ ] Empty states designed
- [ ] Loading states added
- [ ] README finalized with screenshots
- [ ] Blog post(s) written
- [ ] Demo script prepared

**Notes / Decisions:**
> _

---

## Decision Log

> Track important technical decisions here for reference. Format: Date — Decision — Reasoning.

| Date | Decision | Reasoning |
|------|----------|-----------|
| — | Golang (Gin) for backend | Industry standard (48% adoption), 81k+ GitHub stars, best docs, aligns with Datadog |
| — | React + Vite for frontend | Modern tooling, fast HMR, in-demand skills |
| — | TailwindCSS for styling | Rapid iteration, consistent design system |
| — | PostgreSQL on Railway for DB | Relational model fits naturally (users→goals→activities), free tier, simple setup. Chose over MongoDB (wrong model for relational data) and Supabase (would bypass Golang backend, losing portfolio value) |
| — | Railway for all backend infra | Backend + Postgres + Redis in one platform, simple deployment, free tier |
| — | Gemini / Claude API (not OpenAI) | Evaluate both for coaching quality; flexibility to use best tool per task |
| — | Strava as MVP data source | Largest user base, best-documented API, William uses it |
| — | Garmin + Coros in Phase 2 | Second and third most popular in running community |
| — | Manual entry is fallback | App is designed for connected platforms; manual entry supported but not primary UX |
| — | Hybrid coaching approach | Training plans combine proven periodization frameworks + AI personalization |
| — | Monetization deferred | Keep architecture monetization-ready but no paywalls until userbase exists |

---

## Session Log

> After each work session, add a brief entry so the next session has context.

| Date | Session Summary | Next Steps |
|------|----------------|------------|
| — | Project planning complete. Created context.md, plan.md, CLAUDE.md | Begin M0: Scaffold projects |

---
