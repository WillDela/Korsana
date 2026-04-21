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

	// Supabase
	SupabaseURL            string
	SupabaseServiceRoleKey string

	// Strava OAuth
	StravaClientID     string
	StravaClientSecret string
	StravaRedirectURI  string

	// AI Provider APIs (use either Claude or Gemini)
	ClaudeAPIKey string
	GeminiAPIKey string

	// Frontend
	FrontendURL string

	// Email notifications
	SMTPHost      string
	SMTPPort      string
	SMTPUsername  string
	SMTPPassword  string
	SMTPFromEmail string
	SMTPFromName  string

	// CORS
	AllowedOrigins string

	// Environment
	Environment string // "development", "production"
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:                   getEnv("PORT", "8080"),
		DatabaseURL:            getEnv("DATABASE_URL", ""),
		RedisURL:               getEnv("REDIS_URL", "redis://localhost:6379"),
		SupabaseURL:            getEnv("SUPABASE_URL", ""),
		SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		StravaClientID:         getEnv("STRAVA_CLIENT_ID", ""),
		StravaClientSecret:     getEnv("STRAVA_CLIENT_SECRET", ""),
		StravaRedirectURI:      getEnv("STRAVA_REDIRECT_URI", "http://localhost:8080/api/strava/callback"),
		ClaudeAPIKey:           getEnv("CLAUDE_API_KEY", ""),
		GeminiAPIKey:           getEnv("GEMINI_API_KEY", ""),
		FrontendURL:            getEnv("FRONTEND_URL", "http://localhost:5174"),
		SMTPHost:               getEnv("SMTP_HOST", ""),
		SMTPPort:               getEnv("SMTP_PORT", "587"),
		SMTPUsername:           getEnv("SMTP_USERNAME", ""),
		SMTPPassword:           getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail:          getEnv("SMTP_FROM_EMAIL", ""),
		SMTPFromName:           getEnv("SMTP_FROM_NAME", "Korsana"),
		AllowedOrigins:         getEnv("ALLOWED_ORIGINS", "http://localhost:5174"),
		Environment:            getEnv("ENVIRONMENT", "development"),
	}
}

// getEnv returns the value of an environment variable or a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
