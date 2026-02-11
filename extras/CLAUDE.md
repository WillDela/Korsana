# CLAUDE.md — Korsana Project Instructions

> **Purpose:** This file provides context and continuity instructions for any Claude instance (Claude.ai, Claude Code, or API) working on the Korsana project. Read this first before doing any work.

---

## Project Identity

- **Name:** Korsana
- **Type:** AI-powered running coaching platform
- **Mission:** "Korsana is an AI-powered coaching platform that analyzes a runner's unified training data to create and adapt a personalized plan for their specific race goals."
- **Builder:** William — CS student at FIU, Panthers Run Club president, now Marathon runner

---

## Key Files to Read

| File | Purpose |
|------|---------|
| `CLAUDE.md` | You're here. Project instructions + progress tracker. |
| `korsana-strategy.md` | **PRIMARY:** Final strategy — design system, features, AI coach architecture, implementation phases. Read this first for current direction. |
| `context.md` | Full project context: vision, decisions, tech stack, competitive landscape. |
| `plan.md` | Original MVP execution plan (some sections superseded by korsana-strategy.md). |
| `ui-ux-plan.md` | Component specs, spacing rules, animation patterns (reference for implementation). |

**Always read `korsana-strategy.md` first for current direction, then `CLAUDE.md` for guidelines.**

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

### Design System Quick Reference
- **Deep Green (text):** `#13230B`
- **Deep Blue (primary):** `#242E7B`
- **Sage Green (secondary):** `#618B4A`
- **Cream:** `#EEF5DB` — small accents only, NOT page backgrounds
- **Slate (muted):** `#465362`
- **App backgrounds:** `#FAFAFA` light gray (dashboard, coach, settings, goals)
- **Cards:** White `#FFFFFF` with `1px solid #E5E7EB` borders
- **Status:** On Track = Sage Green, Warning = Amber `#d97706`, Behind = Red `#dc2626`
- **Headlines font:** Libre Baskerville (serif — editorial, distinctive)
- **UI/Body font:** Fira Sans (humanist sans — clean, warm)
- **Data/Numbers font:** IBM Plex Mono (monospace — precision)
- **Slogan:** "Your plan, our goal."
- **Philosophy:** Athletic Precision — serif headlines for credibility, monospace data for precision, generous spacing, no decoration for decoration's sake.
- **Coaching approach:** Always hybrid — established training principles + AI personalization. Never generic linear plans. AI is reactive (on-demand), not automatic.
- **Full design specs:** See `korsana-strategy.md` for implementation plan, `ui-ux-plan.md` for component specs.

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
| M0: Project Scaffolding | 🟡 In Progress | ✓ | — |
| M1: User Authentication | 🟡 In Progress | ✓ | — |
| M2: Strava OAuth | 🟡 In Progress | ✓ | — |
| M3: Race Goal Setup | 🟡 In Progress | ✓ | — |
| M4: Dashboard | 🟡 In Progress | ✓ | — |
| M5: AI Coach | 🟡 In Progress | ✓ | — |
| M6: Polish & Deploy | 🔲 Not Started | — | — |

> ⚠️ **Note:** M0-M5 all have initial structure/scaffolding from "Korsana MVP first round" commit. Code exists for auth handlers, Strava client, goals handlers, dashboard page, and coach service — but completion status of each needs detailed audit. Home page, login, and signup flows are working. **Critical issue:** signup leads to blank dashboard screen — addressed in UI/UX Phase A onboarding flow.

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

### UI/UX Enhancement Track (runs parallel to milestones)
> Full plan in `ui-ux-plan.md`. Track high-level phase progress here.

**Phase A: Fix Critical Path**
- [ ] Skeleton loader components
- [ ] Onboarding flow (fixes blank screen after signup)
- [ ] Dashboard layout with skeleton states
- [ ] Page transition system (`<PageTransition>` wrapper)

**Phase B: Dashboard Comes Alive**
- [ ] Metric cards with animated number counters
- [ ] Chart animations (bar growth, line draw)
- [ ] Activity feed with stagger animations
- [ ] Sticky goal header with countdown
- [ ] AI insight card

**Phase C: Interaction Polish**
- [ ] Micro-interaction component library (buttons, cards, inputs)
- [ ] Auth page polish (split layout, form animations)
- [ ] AI Coach chat animations (message entrance, typing indicator, suggested prompts)
- [ ] Navigation animations
- [ ] Staggered reveals across all pages

**Phase D: Landing Page & Wow Factor**
- [ ] Landing page full build with scroll-triggered sections
- [ ] Hero section with text reveal animation
- [ ] "How it works" animated flow
- [ ] Settings page polish

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
| — | Framer Motion for animations | React-native, declarative API, industry standard for React UI animation, great for dashboards and page transitions |
| — | Accent/pop color TBD | If a high-impact accent is needed, it will be chosen deliberately — not defaulted. Teal is not the direction. |
| — | Monetization deferred | Keep architecture monetization-ready but no paywalls until userbase exists |
| Feb 2026 | Libre Baskerville (headlines) + Fira Sans (UI) + IBM Plex Mono (numbers) | Serif headlines give editorial distinction from all-sans-serif competitors. Fira Sans is warmer than Inter. Mono stays for data precision. |
| Feb 2026 | Cream (#EEF5DB) demoted from backgrounds to small accents | Full-page cream backgrounds made app feel dated. Light gray (#FAFAFA) is industry standard. |
| Feb 2026 | Unified nav: Deep Blue app bar across ALL authenticated pages | 4 different nav patterns was the biggest "prototype" tell. One component, two modes (landing/app). |
| Feb 2026 | 7-day Training Calendar as dashboard centerpiece | Every competitor (COROS, Runna, Strava) centers around a calendar. Goes below Race Header, above metrics. |
| Feb 2026 | AI Coach is reactive only, not automatic | No auto-analysis on page load. User asks → coach pulls last 14 days → responds. Saves tokens. |
| Feb 2026 | AI can write structured plans to training_calendar table | Coach generates JSON → backend parses → writes to DB → calendar updates. User can edit after. |
| Feb 2026 | Race Readiness Score: Korsana's flagship 0-100 metric | Composite of volume adequacy, pace fitness, consistency, long run readiness, trend direction. Unique — not a COROS/Garmin copy. |
| Feb 2026 | New slogan: "Your plan, our goal." | Replaces previous taglines. Emphasizes partnership between runner and platform. |

---

## Session Log

> After each work session, add a brief entry so the next session has context.

| Date | Session Summary | Next Steps |
|------|----------------|------------|
| — | Project planning complete. Created context.md, plan.md, CLAUDE.md | Begin M0: Scaffold projects |
| — | Locked tech stack: Gin, PostgreSQL on Railway, Framer Motion. Created ui-ux-plan.md with full animation/design system. Updated all files. | Audit existing code to determine exact M0-M5 completion. Start UI/UX Phase A (fix blank screen, onboarding flow, skeletons). |
| — | Merged comprehensive UI/UX implementation spec into ui-ux-plan.md. Added: full design system (color usage by context, type scale with Tailwind classes, spacing system with anti-cramping rules), component specs (nav, hero, cards, tables, buttons, inputs), page layouts with exact structure, status colors, QA checklist. 17-day phased implementation plan. Removed Electric Teal — accent/pop color is TBD. | Start Phase 1: design system foundation in code (CSS vars, Tailwind config, font imports). |
| Feb 2026 | **Major strategy session.** Reviewed all 7 current page screenshots. Researched Strava, COROS Training Hub, Notion, Runna design patterns. Analyzed Libre Baskerville, Inter Display, Fira Sans typography. Created `korsana-strategy.md` — the new single source of truth. Key decisions: typography trio (Libre Baskerville + Fira Sans + IBM Plex Mono), light gray backgrounds replacing Cream, unified Deep Blue nav, 7-day training calendar as dashboard centerpiece, Race Readiness Score as flagship metric, reactive AI coach architecture with calendar write capability. William answered all 14 clarifying questions. Full project overview documented (10 pages, 18 API routes, 6 DB tables, 4 services). | **Start Phase 1:** Implement design system in code — fonts, colors, unified nav. Then Phase 2: Training Calendar component + DB table. |

---
