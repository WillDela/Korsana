# Korsana 🏃

> **AI-Powered Running Coach** — Get race-ready with personalized training powered by your data.

## Mission Statement

"Korsana is an AI-powered coaching platform that analyzes a runner's unified training data to create and adapt a personalized plan for their specific race goals."

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + Vite + TailwindCSS |
| **Backend** | Go + Gin |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **AI** | Google Gemini / Anthropic Claude |

## Project Structure

```
├── backend/                 # Go API server
│   ├── cmd/server/         # Entry point
│   ├── internal/           # Private application code
│   │   ├── api/           # HTTP handlers & middleware
│   │   ├── config/        # Configuration
│   │   ├── database/      # DB connection & migrations
│   │   ├── models/        # Data models
│   │   ├── repository/    # Data access layer
│   │   └── services/      # Business logic
│   └── docker-compose.yml # Local dev services
│
├── frontend/               # React application
│   └── src/
│       ├── components/    # UI components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom hooks
│       └── api/           # API client
```

## Getting Started

### Prerequisites

- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Backend Setup

```bash
# Start PostgreSQL and Redis
cd backend
docker-compose up -d

# Copy environment file
cp .env.example .env

# Install Go dependencies
go mod tidy

# Run the server
go run cmd/server/main.go
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be at `http://localhost:5173` and the API at `http://localhost:8080`.

## MVP Features

- [ ] User authentication (signup/login)
- [ ] Strava OAuth integration
- [ ] Race goal setup (race, date, target time)
- [ ] Race Readiness Dashboard
  - Countdown to race
  - Weekly mileage tracking
  - Pace analysis
- [ ] AI Coach chat

## Development Timeline

| Sprint | Duration | Focus |
|--------|----------|-------|
| 1 | Weeks 1-2 | Foundation (Auth, Setup) |
| 2 | Weeks 3-4 | Strava Integration |
| 3 | Weeks 5-6 | Goals & Dashboard |
| 4 | Weeks 7-8 | AI Coach |

## License

MIT

---

*Built for the Miami Marathon 2026* 🏃‍♂️
