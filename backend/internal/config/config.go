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

	// OpenAI
	OpenAIAPIKey string

	// Environment
	Environment string // "development", "production"
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/allinrun?sslmode=disable"),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:          getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
		StravaClientID:     getEnv("STRAVA_CLIENT_ID", ""),
		StravaClientSecret: getEnv("STRAVA_CLIENT_SECRET", ""),
		StravaRedirectURI:  getEnv("STRAVA_REDIRECT_URI", "http://localhost:8080/api/strava/callback"),
		OpenAIAPIKey:       getEnv("OPENAI_API_KEY", ""),
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
