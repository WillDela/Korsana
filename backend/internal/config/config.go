package config

import (
	"os"
)

// Config holds all configuration for the application
type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT
	JWTSecret string

	// Strava OAuth
	StravaClientID     string
	StravaClientSecret string
	StravaRedirectURI  string

	// AI Provider APIs (use either Claude or Gemini)
	ClaudeAPIKey string
	GeminiAPIKey string

	// CORS
	AllowedOrigins string

	// Environment
	Environment string // "development", "production"
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/korsana?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:          getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
		StravaClientID:     getEnv("STRAVA_CLIENT_ID", ""),
		StravaClientSecret: getEnv("STRAVA_CLIENT_SECRET", ""),
		StravaRedirectURI:  getEnv("STRAVA_REDIRECT_URI", "http://localhost:8080/api/strava/callback"),
		ClaudeAPIKey:       getEnv("CLAUDE_API_KEY", ""),
		GeminiAPIKey:       getEnv("GEMINI_API_KEY", ""),
		AllowedOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
		Environment:        getEnv("ENVIRONMENT", "development"),
	}
}

// getEnv returns the value of an environment variable or a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
