# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Cache dependency download as a separate layer
COPY go.mod go.sum ./
RUN go mod download

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

# Runtime stage
FROM alpine:3.21

# CA certificates are required for HTTPS calls to Supabase, Strava, Gemini, Redis
RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/server .

# Run as a non-root user
RUN addgroup -S korsana && adduser -S korsana -G korsana
USER korsana

EXPOSE 8080

ENTRYPOINT ["./server"]
