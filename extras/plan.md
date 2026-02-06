# Korsana — MVP Development Plan

> **This is the execution plan.** Each milestone is broken into concrete tasks. Work through them in order — each builds on the last. Estimated total: ~9 weeks at 10-15 hrs/week.

---

## Milestone 0: Project Scaffolding
**Goal:** Repos initialized, tooling configured, ready to write feature code.
**Time estimate:** 2-3 days

### Tasks:
- [ ] Create GitHub repo: `korsana`
- [ ] Initialize Golang backend project
  - [ ] Choose framework (Gin or Echo) and initialize module
  - [ ] Set up project structure: `/cmd`, `/internal`, `/pkg`, `/api`
  - [ ] Add `.env` support (godotenv or viper)
  - [ ] Add basic health check endpoint (`GET /health`)
  - [ ] Set up `Makefile` or task runner for common commands
- [ ] Initialize React frontend project
  - [ ] Scaffold with Vite + React + TypeScript
  - [ ] Install TailwindCSS and configure
  - [ ] Install React Router, React Query (TanStack)
  - [ ] Set up basic folder structure: `/components`, `/pages`, `/hooks`, `/api`, `/lib`
- [ ] Configure development environment
  - [ ] Docker Compose for local Postgres + Redis (optional but recommended)
  - [ ] `.env.example` files for both frontend and backend
  - [ ] Basic CORS configuration on backend for local frontend
- [ ] Write initial `README.md` with project description, tech stack, and setup instructions
- [ ] First commit and push

**Done when:** `go run` serves the API, `npm run dev` serves the frontend, both talk to each other locally.

---

## Milestone 1: User Authentication
**Goal:** Users can sign up, log in, and maintain sessions.
**Time estimate:** 1 week

### Backend Tasks:
- [ ] Design and run database migration: `users` table
  - Fields: `id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`
- [ ] Implement password hashing (bcrypt)
- [ ] Build auth endpoints:
  - [ ] `POST /api/auth/register` — create account
  - [ ] `POST /api/auth/login` — authenticate, return JWT or session token
  - [ ] `GET /api/auth/me` — return current user from token
  - [ ] `POST /api/auth/logout` — invalidate session
- [ ] Implement JWT middleware for protected routes
- [ ] Store sessions in Redis (or use stateless JWT — decide and document decision)

### Frontend Tasks:
- [ ] Build auth pages:
  - [ ] Sign Up page (email, password, name)
  - [ ] Login page
- [ ] Implement auth state management (React Context or Zustand)
- [ ] Add protected route wrapper (redirect to login if unauthenticated)
- [ ] Build basic app shell/layout (nav bar with user info, logout button)
- [ ] API client setup (axios or fetch wrapper with token injection)

**Done when:** A user can register, log in, see their name in the nav, and be redirected if not authenticated.

---

## Milestone 2: Strava OAuth Integration
**Goal:** Users can connect their Strava account and Korsana can access their data.
**Time estimate:** 1-1.5 weeks

### Pre-work:
- [ ] Register Korsana as a Strava API application (https://www.strava.com/settings/api)
- [ ] Document the OAuth 2.0 flow (good for blog post)
- [ ] Read Strava API rate limits and document constraints

### Backend Tasks:
- [ ] Add Strava credentials to environment config
- [ ] Build OAuth endpoints:
  - [ ] `GET /api/strava/connect` — redirect user to Strava authorization URL
  - [ ] `GET /api/strava/callback` — handle Strava's redirect, exchange code for tokens
- [ ] Store Strava tokens in `users` table (or separate `strava_connections` table)
  - Fields: `access_token`, `refresh_token`, `expires_at`, `strava_athlete_id`
- [ ] Implement token refresh logic (Strava tokens expire every 6 hours)
- [ ] Build activity sync endpoint:
  - [ ] `POST /api/strava/sync` — fetch recent activities from Strava API
  - [ ] Parse and store relevant run data only (ignore rides, swims, etc.)
- [ ] Design and run migration: `activities` table
  - Fields: `id`, `user_id`, `source` (strava), `external_id`, `name`, `date`, `distance_meters`, `duration_seconds`, `avg_pace_per_km`, `avg_heart_rate`, `elevation_gain`, `type`, `raw_data` (JSONB for flexibility), `created_at`

### Frontend Tasks:
- [ ] "Connect Strava" button on settings or onboarding page
- [ ] Handle OAuth callback redirect (success/error states)
- [ ] Show Strava connection status (connected/disconnected)
- [ ] Display synced activities in a basic list/table view
  - Show: date, name, distance, pace, duration
  - Sort by most recent

**Done when:** User clicks "Connect Strava," authorizes, and sees their recent runs listed in Korsana.

> 📝 **Blog post opportunity:** "OAuth 2.0 Deep Dive: Connecting to Strava API with Golang"

---

## Milestone 3: Race Goal Setup
**Goal:** Users can set a race goal that becomes the lens for everything in the app.
**Time estimate:** 3-5 days

### Backend Tasks:
- [ ] Design and run migration: `race_goals` table
  - Fields: `id`, `user_id`, `race_name`, `race_date`, `distance_km`, `target_time_seconds`, `status` (active/completed/abandoned), `created_at`, `updated_at`
- [ ] Build goal endpoints:
  - [ ] `POST /api/goals` — create a race goal
  - [ ] `GET /api/goals` — list user's goals
  - [ ] `GET /api/goals/:id` — get specific goal with computed metrics
  - [ ] `PUT /api/goals/:id` — update goal
  - [ ] `DELETE /api/goals/:id` — remove goal
- [ ] Add computed fields to goal response:
  - Days until race
  - Required average pace (from target time and distance)
  - Weeks of training remaining

### Frontend Tasks:
- [ ] Build goal-setting flow (can be a modal or dedicated page):
  - Race name (text input)
  - Race date (date picker)
  - Distance (dropdown: 5K, 10K, Half Marathon, Marathon, Custom)
  - Target time (hours:minutes:seconds input OR "Just finish" option)
- [ ] Show active goal prominently (sticky header or sidebar element)
- [ ] Goal management: view, edit, delete goals

**Done when:** User can set "Miami Marathon, Jan 2026, 3:45:00" as their goal and see it reflected throughout the app.

---

## Milestone 4: Race Readiness Dashboard
**Goal:** The main screen answers "Am I on track?" with clear, data-driven visuals.
**Time estimate:** 1.5-2 weeks

### Backend Tasks:
- [ ] Build dashboard data endpoint: `GET /api/dashboard`
  - Aggregate recent activity data against active goal
  - Return computed metrics:
    - [ ] **Countdown:** days/weeks until race
    - [ ] **Weekly mileage:** actual total for current & recent weeks
    - [ ] **Pace analysis:** average pace from recent runs vs. required goal pace
    - [ ] **Mileage trend:** weekly totals for past 4-8 weeks
    - [ ] **Long run tracker:** longest run in recent weeks vs. recommended
- [ ] Define "planned mileage" logic for MVP:
  - Option A: Simple ramp-up formula based on race distance and weeks remaining
  - Option B: User-input weekly mileage target
  - Decision: Document which approach and why

### Frontend Tasks:
- [ ] Build dashboard page with goal context header:
  - Race name + countdown (e.g., "Miami Marathon — 16 weeks away")
  - Target time + required pace
- [ ] Build dashboard metric cards:
  - [ ] **Countdown widget** — large, prominent
  - [ ] **Weekly mileage chart** — bar chart, planned vs. actual (Recharts)
  - [ ] **Pace comparison** — current avg pace vs. goal pace (visual indicator: on track / behind / ahead)
  - [ ] **Mileage trend line** — line chart of weekly totals over time
  - [ ] **Recent runs list** — last 5-7 runs with key stats
- [ ] Make dashboard mobile-responsive
- [ ] Ensure all numerical data uses monospace font (IBM Plex Mono)
- [ ] Apply "Athletic Precision" design system: navy/orange/teal palette, purposeful color coding

**Done when:** Dashboard shows real Strava data contextualized against the race goal. William can glance at it and know if he's on track for Miami.

> 📝 **Blog post opportunity:** "Designing a Data-Dense Dashboard for Runners"

---

## Milestone 5: AI Coach Chat
**Goal:** Users can chat with an AI that knows their training data and race goal.
**Time estimate:** 1-1.5 weeks

### Backend Tasks:
- [ ] Set up AI API integration (Gemini and/or Claude — evaluate both for coaching quality)
- [ ] Design and run migration: `coach_conversations` table
  - Fields: `id`, `user_id`, `messages` (JSONB array), `created_at`, `updated_at`
- [ ] Build chat endpoints:
  - [ ] `POST /api/coach/message` — send message, get AI response
  - [ ] `GET /api/coach/conversations` — list past conversations
  - [ ] `GET /api/coach/conversations/:id` — get specific conversation
- [ ] Implement context builder:
  - [ ] Gather user's active race goal
  - [ ] Gather recent activities (last 2-4 weeks)
  - [ ] Compute summary stats (weekly mileage, avg pace, longest run, trend direction)
  - [ ] Build system prompt that includes all context
  - [ ] Ensure hybrid coaching approach: grounded in established training principles (periodization, 80/20 rule, progressive overload) + personalized to user's data — never generic linear plans
- [ ] Craft system prompt for the AI coach:
  - Role: "You are Korsana, an experienced running coach..."
  - Context: user's goal, recent training data, computed metrics
  - Constraints: running-specific, evidence-based advice, acknowledge limitations
  - Tone: direct, supportive, data-informed
- [ ] Implement token/context management (keep within API provider limits)

### Frontend Tasks:
- [ ] Build chat interface:
  - [ ] Message input with send button
  - [ ] Message history display (user messages vs. AI responses)
  - [ ] Loading/typing indicator while AI responds
  - [ ] Auto-scroll to latest message
- [ ] Place chat prominently in the app (dedicated page or slide-out panel)
- [ ] Show conversation history (ability to start new conversation)

**MVP AI Coach should handle these well:**
- "Should I run today? My legs feel tired."
- "Based on my recent runs, is my 3:45 goal realistic?"
- "What should I focus on this week?"
- "I missed 3 days of training. How should I adjust?"
- "What pace should my long run be this weekend?"

**Done when:** User can ask the AI coach about their training, and the AI responds with advice grounded in their actual Strava data and race goal.

> 📝 **Blog post opportunity:** "Building an AI That Understands Running Training"

---

## Milestone 6: Polish, Deploy & Document
**Goal:** Ship it. Make it real. Make it portfolio-ready.
**Time estimate:** 1 week

### Deployment Tasks:
- [ ] Deploy backend to Railway
  - [ ] Configure environment variables
  - [ ] Set up Railway Postgres instance
  - [ ] Set up Railway Redis instance
  - [ ] Configure domain/subdomain (api.korsana.dev or similar)
- [ ] Deploy frontend to Vercel
  - [ ] Connect to GitHub repo for auto-deploys
  - [ ] Configure environment variables
  - [ ] Set up custom domain (korsana.dev or similar)
- [ ] Set up Strava OAuth callback for production URL
- [ ] SSL/HTTPS verified on all endpoints

### Quality & Polish Tasks:
- [ ] Mobile responsiveness audit (test on actual phone)
- [ ] Error handling pass:
  - [ ] API errors show user-friendly messages
  - [ ] Strava disconnect / token expiry handled gracefully
  - [ ] Empty states (no runs, no goal set) have helpful prompts
- [ ] Loading states for all async operations
- [ ] Basic input validation (frontend + backend)
- [ ] Performance check: dashboard loads in < 2 seconds

### Documentation Tasks:
- [ ] Clean up GitHub README:
  - [ ] Project description and screenshots
  - [ ] Tech stack with rationale
  - [ ] Architecture diagram
  - [ ] Local development setup instructions
  - [ ] API documentation (at least key endpoints)
- [ ] Write at least 1 technical blog post (ideally 3 by this point)
- [ ] Prepare demo script for interviews:
  - [ ] 2-minute walkthrough of the app
  - [ ] Key technical decisions to highlight
  - [ ] Challenges faced and how they were solved

**Done when:** Anyone can visit the URL, and William is actively using it for Miami Marathon training. The GitHub repo tells the full story.

---

## Timeline Summary

| Week | Milestone | Key Deliverable |
|------|-----------|----------------|
| 1 | M0: Scaffolding | Repos live, projects talking to each other |
| 2-3 | M1: Authentication | Users can sign up and log in |
| 3-4 | M2: Strava OAuth | Users can connect Strava and see their runs |
| 5 | M3: Race Goals | Users can set and manage race goals |
| 5-7 | M4: Dashboard | "Am I on track?" answered with real data |
| 7-8 | M5: AI Coach | Conversational coaching grounded in training data |
| 9 | M6: Ship It | Deployed, polished, documented, portfolio-ready |

---

## Post-MVP Backlog (Not Now, But Noted)

These are ideas that have been discussed but are explicitly deferred:

- [ ] Training plan generation (hybrid: rule-based structure + AI personalization)
- [ ] Multi-platform data (Garmin, Coros, Apple Health)
- [ ] Manual activity entry (fallback for unconnected users)- [ ] Plan adaptation based on performance
- [ ] Advanced pace predictions
- [ ] Injury risk indicators
- [ ] Weather integration
- [ ] Manual run entry (no watch/Strava users)
- [ ] Social/community features
- [ ] Workout library
- [ ] Native mobile app (React Native)
- [ ] Race history & analytics
- [ ] Coaching style customization
