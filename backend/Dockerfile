# syntax=docker/dockerfile:1.7

# ─── Build stage ──────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder
WORKDIR /app

# Cache dependency download as a separate layer.
COPY go.mod go.sum ./
RUN go mod download

# Build both binaries in one stage so the dep-download cache is reused.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/server ./cmd/server \
 && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/migrate ./cmd/migrate

# ─── Common runtime base ──────────────────────────────────────────────────
FROM alpine:3.21 AS runtime-base
# CA certs for HTTPS calls to Supabase, Strava, Gemini.
# wget is provided by busybox in the alpine base; no extra install needed.
RUN apk --no-cache add ca-certificates \
 && addgroup -S korsana && adduser -S korsana -G korsana
WORKDIR /app
USER korsana

# ─── Migrate runtime (used by docker-compose; build with --target=migrate) ─
FROM runtime-base AS migrate
COPY --from=builder /out/migrate /app/migrate
ENTRYPOINT ["/app/migrate"]

# ─── Server runtime (default — must be last so `docker build .` produces it) ─
FROM runtime-base AS server
COPY --from=builder /out/server /app/server
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O - http://localhost:8080/health || exit 1
ENTRYPOINT ["/app/server"]
