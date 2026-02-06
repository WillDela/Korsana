package main

import (
	"log"
	"net/http"

	"github.com/korsana/backend/internal/api/handlers"
	"github.com/korsana/backend/internal/api/middleware"
	"github.com/korsana/backend/internal/config"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/services"
	"github.com/korsana/backend/pkg/strava"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load Configuration
	cfg := config.Load()

	// 2. Initialize Database
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 3. Initialize External Clients
	stravaClient := strava.NewClient(cfg.StravaClientID, cfg.StravaClientSecret, cfg.StravaRedirectURI)

	// 4. Initialize Services
	authService := services.NewAuthService(db, cfg)
	stravaService := services.NewStravaService(db, stravaClient)
	goalsService := services.NewGoalsService(db)
	coachService := services.NewCoachService(db, cfg, goalsService)

	// 5. Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService)
	stravaHandler := handlers.NewStravaHandler(stravaService)
	goalsHandler := handlers.NewGoalsHandler(goalsService)
	coachHandler := handlers.NewCoachHandler(coachService)

	// 6. Setup Router
	r := gin.Default()

	// CORS Configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"} // Frontend URL
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		if err := db.Health(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// API Routes
	api := r.Group("/api")
	{
		// Public Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthMiddleware(cfg), authHandler.Me)
			auth.POST("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)
		}

		// Protected Routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// Strava
			strava := protected.Group("/strava")
			{
				strava.GET("/auth", stravaHandler.AuthURL)
				strava.GET("/callback", stravaHandler.Callback)
				strava.POST("/sync", stravaHandler.SyncActivities)
				strava.GET("/activities", stravaHandler.GetActivities)
			}

			// Race Goals
			goals := protected.Group("/goals")
			{
				goals.POST("", goalsHandler.CreateGoal)
				goals.GET("", goalsHandler.GetGoals)
				goals.GET("/active", goalsHandler.GetActiveGoal)
				goals.GET("/:id", goalsHandler.GetGoal)
				goals.PUT("/:id", goalsHandler.UpdateGoal)
				goals.DELETE("/:id", goalsHandler.DeleteGoal)
			}

			// AI Coach
			coach := protected.Group("/coach")
			{
				coach.POST("/message", coachHandler.SendMessage)
				coach.GET("/history", coachHandler.GetConversationHistory)
			}

			// Dashboard (Placeholder)
			protected.GET("/dashboard", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "Welcome to the dashboard"})
			})
		}
	}

	// Start Server
	log.Printf("Korsana API server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
