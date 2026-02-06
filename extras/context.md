# Korsana — Project Context

> **This file is a living reference document.** It captures every key decision, design direction, and strategic choice made for Korsana. Use it as the single source of truth when resuming work in any environment (Claude Code, Claude.ai, or solo).

---

## 1. What Is Korsana?

**Mission Statement:**
"Korsana is an AI-powered coaching platform that analyzes a runner's unified training data to create and adapt a personalized plan for their specific race goals."

**Name Origin:** Derived from *Korsa* (Swedish: "to cross" / "to traverse") — evoking the idea of crossing the finish line. Fits the goal-oriented identity.

**What Korsana IS:**
- An active training partner, not a passive tracker
- A goal-oriented coaching platform (think: Runna / Endorphin Run, but better)
- An AI assistant for runners (inspired by Lifetime Fitness's L*AI*C assistant)
- A unified hub that pulls run data from external sources and makes it actionable

**What Korsana is NOT:**
- Not a social platform (no posting runs like Strava — if added later, it's not a focus)
- Not a watch replacement (doesn't try to replicate Garmin/Coros dashboards)
- Not a generic fitness app (running-specific, race-goal-specific)
- Not a tutorial/class project (this is a real product solving a real problem)

---

## 2. Who Is Building This & Why

**Builder:** William — 3rd year CS student at FIU
- President & Co-founder of Panthers Run Club at FIU
- Training for the Miami Marathon (~4 months out)
- Targeting a Datadog internship in ~5 months
- Building Korsana as a flagship portfolio project

**Why This Matters for the Portfolio:**
- Authenticity: Building for a problem William personally experiences
- Leadership narrative: Run club experience + technical execution
- Domain expertise: William IS the target user
- Memorable angle: "The running coder" stands out vs. generic CS students
- Tech stack alignment: Golang backend maps directly to Datadog's stack

---

## 3. Competitive Landscape & Positioning

| App | Strengths | Weaknesses | Korsana's Edge |
|-----|-----------|------------|----------------|
| **Strava** | Social + analytics, huge community | Weak AI coaching, no training plans | AI coaching + race-goal focus |
| **Runna** | Good training plans | Limited data integration, no AI chat | Unified data + conversational AI |
| **Endorphin Run** | Personalized plans | Limited platform support | Multi-platform data, smarter adaptation |
| **Garmin Connect** | Great hardware integration | Poor AI, closed ecosystem | Platform-agnostic, AI-powered |
| **Coros** | Solid training features | Closed ecosystem | Open data integration |
| **Lifetime (L\*AI\*C)** | Great AI assistant UX | General fitness, not running-specific | Running-specific AI with training data context |

**Korsana's unique position:** The only platform that unifies your run data from any source AND provides AI coaching contextualized to your specific race goal.

---

## 4. Target User

**Primary persona:** The goal-oriented runner
- Has a specific race they're training for (5K, half marathon, marathon, ultra)
- Uses a GPS watch or phone to track runs
- Wants to know: "Am I on track for my goal?"
- Values data and structure over social features
- May use multiple platforms (Strava + Garmin, Strava + Coros, etc.)

**First user story:**
> "As a runner training for a specific race, I want to connect my Strava data and input my race goal, so that I can see my current training progress analyzed in the context of what is required to achieve that goal."

---

## 5. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | Golang (Gin) | Industry standard (~48% of Go devs), 81k+ GitHub stars, best docs, gentle learning curve — aligns with Datadog's stack |
| **Frontend** | React (Vite) | Modern, in-demand, great ecosystem |
| **Styling** | TailwindCSS | Rapid development, consistent design system |
| **Database** | PostgreSQL (hosted on Railway) | Relational model fits the data naturally, free tier, simple connection string setup |
| **Caching** | Redis | Session management, API rate limit handling |
| **AI** | Google Gemini API and/or Anthropic Claude API | Conversational coaching, plan generation. Evaluate both during development — use whichever delivers better running-specific responses, or use both for different tasks. |
| **Data Fetching** | React Query (TanStack Query) | Caching, background sync, optimistic updates |
| **Charts** | Recharts or Chart.js | Training data visualization |
| **Deployment** | Vercel (frontend) + Railway (backend + Postgres + Redis) | Simple, affordable, everything in one platform for backend |

---

## 6. Core Architecture

```
React Frontend (Vite + TailwindCSS)
    ↓ HTTP/REST
Golang API Server (Gin)
    ↓
    ├─→ PostgreSQL (users, race goals, activities, conversations)
    ├─→ Redis (sessions, caching, rate limit tracking)
    ├─→ Strava API (OAuth 2.0 + activity sync)
    └─→ Gemini / Claude API (coaching responses with training context)
```

**Core Database Entities:**
- `users` — auth, profile, Strava tokens
- `race_goals` — race name, date, distance, target time, status
- `activities` — unified run data synced from external sources
- `coach_conversations` — AI chat history with context

---

## 7. Design Philosophy: "Athletic Precision"

**Core Principles:**
- Precision over prettiness — data accuracy matters most
- Performance over decoration — fast and responsive
- Focus over features — everything ties back to the race goal
- Credibility over trends — feels like a real training tool

**Visual Direction (Blue-Green Vibe):**

| Role | Hex | Description | Usage |
|------|-----|-------------|-------|
| **Deep Green** | `#13230B` | Near-black forest green | Backgrounds, dark sections, primary text on light |
| **Deep Blue** | `#242E7B` | Rich navy-blue | Primary brand color, buttons, active states |
| **Sage Green** | `#618B4A` | Olive/sage green | Secondary actions, success states, positive metrics |
| **Cream** | `#EEF5DB` | Light warm off-white | Page backgrounds, card surfaces |
| **Slate** | `#465362` | Dark blue-gray | Secondary text, borders, muted UI elements |

> ⚠️ Palette is subject to change but the direction is blue-green: natural, athletic, grounded.
| **Data font** | IBM Plex Mono | Precision for numbers/metrics |
| **Headings** | Inter Bold/Black | Clean, modern |
| **Body text** | Inter Regular | Readable, fast |

**What to AVOID:**
- Gradient backgrounds everywhere
- Generic emojis as UI elements
- Stock fitness imagery
- Gamification (badges, streaks) in MVP
- "AI-generated aesthetic" — generic, soulless design

**What to EMBRACE:**
- High contrast, readable typography
- Data-dense interfaces where appropriate
- Monospace fonts for numerical data
- Purposeful color (meaning, not decoration)
- Real photography where appropriate (authentic running imagery)

**Layout Principles:**
- Race goal context always visible (sticky countdown/header)
- Information density on dashboard (runners want detail)
- Table-based activity lists (scannable, professional)
- Purposeful white space around critical metrics

---

## 8. Feature Scope by Phase

### Phase 1: MVP — "Prove the Concept"
> Goal: Functional demo William can use for Miami Marathon training

**Included:**
- User authentication (signup/login)
- Strava OAuth connection
- Race goal setup (race name, date, distance, target time)
- Activity sync (recent runs from Strava)
- Race readiness dashboard:
  - Countdown to race day
  - Weekly mileage: planned vs. actual
  - Current pace vs. goal pace
- AI coach chat (knows your training data, answers race-related questions)
- Mobile-responsive web app

**Explicitly excluded from MVP:**
- Multi-platform data sync (Garmin, Apple Health, Coros) — but architecture should be ready for it
- Full training plan generation
- Social features
- Native mobile app
- Advanced analytics
- Workout library

> **Note on manual entry:** Supported eventually, but the app is designed around connected platforms (Strava for MVP, Garmin + Coros in Phase 2). Manual entry is a fallback, not the primary experience.

### Phase 2: "The Intelligence Layer"
- AI-generated training plans — **hybrid approach:** rule-based structure (proven periodization frameworks) + AI personalization (adapts to individual data). Never purely linear or cookie-cutter.
- Plan adaptation based on actual performance
- Multi-platform integration (Garmin, Coros, Apple Health)
- Manual activity entry (for users without connected devices)
- Advanced pace predictions
- Injury risk indicators
- Weather integration

### Phase 3: "The Complete Platform"
- Multiple simultaneous race goals
- Race history & analytics
- Community features (optional)
- Workout library
- React Native mobile app
- Coaching style customization
- Advanced analytics suite

---

## 9. Key Technical Challenges (Portfolio Talking Points)

Each of these becomes a potential blog post or interview discussion point:

1. **OAuth 2.0 Implementation** — Secure Strava authentication flow
2. **Data Normalization** — Transforming Strava's API format into Korsana's unified schema
3. **Rate Limit Management** — Handling Strava's API constraints gracefully
4. **AI Context Management** — Feeding relevant training data to Gemini/Claude without exceeding token limits
5. **Prompt Engineering** — Crafting coaching prompts that produce useful, runner-specific advice (hybrid: grounded in training science + personalized to data)
6. **Real-time Data Sync** — Background jobs for keeping activity data fresh
7. **Geospatial Queries** — PostGIS for route analysis (Phase 2+)

---

## 10. Success Criteria

**MVP is "done" when:**
- [ ] Deployed and accessible via public URL
- [ ] William actively uses it for Miami Marathon training
- [ ] Dashboard accurately reflects training progress vs. goal
- [ ] AI coach can answer: "Should I run today?" with context
- [ ] Clean, documented codebase on GitHub
- [ ] Demo-ready for internship interviews

**Portfolio is "done" when:**
- [ ] Portfolio site live with Korsana featured prominently
- [ ] 3+ technical blog posts written
- [ ] Can confidently explain architecture decisions in interviews
- [ ] Project demonstrates Golang proficiency for Datadog
- [ ] Cohesive narrative: runner + leader + builder

---

## 11. Inspiration & References

- **Runna** — Training plan UX, goal-setting flow
- **Endorphin Run** — Personalized plan adaptation
- **Strava** — Activity data display, route maps
- **Lifetime Fitness (L\*AI\*C)** — AI assistant UX (centered, conversational, actionable)
- **Linear** — Clean, data-dense dashboard design
- **Raycast** — Minimal, high-performance UI patterns

---

## 12. Open Questions & Future Decisions

These are items flagged for future discussion — not blocking MVP work:

- [x] ~~Golang framework choice~~ → **Gin** (industry standard, 48% adoption, best docs, aligns with Datadog)
- [x] ~~AI provider~~ → **Gemini and/or Claude API** (evaluate both; not OpenAI)
- [x] ~~Hosting provider~~ → **Railway** for backend, Postgres, and Redis. **Vercel** for frontend.
- [ ] Training plan generation approach — **must be hybrid** (rule-based structure + AI personalization, never purely linear)
- [ ] Whether to support manual activity entry → **Yes, supported but secondary.** Connected platforms (Strava, Garmin, Coros) are the primary path.
- [ ] Monetization model — **Keep in mind during architecture decisions, but don't push until there's a userbase.** No paywalls, no premium tiers in MVP.
- [ ] Beta testing strategy (who are the first users beyond William?)
