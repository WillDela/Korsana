package main

import (
	"log"
	"net/http"
	"strings"

	"github.com/joho/godotenv"
	"github.com/korsana/backend/internal/api/handlers"
	"github.com/korsana/backend/internal/api/middleware"
	"github.com/korsana/backend/internal/config"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/services"
	"github.com/korsana/backend/pkg/strava"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Load .env file (ignore error if not present, e.g. in production)
	_ = godotenv.Load()

	// 1. Load Configuration
	cfg := config.Load()

	// 2. Initialize Database
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 3. Initialize Redis
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}
	redisClient := redis.NewClient(opt)

	// 4. Initialize External Clients
	stravaClient := strava.NewClient(cfg.StravaClientID, cfg.StravaClientSecret, cfg.StravaRedirectURI)

	// 5. Initialize Services
	authService := services.NewAuthService(db)
	calendarService := services.NewCalendarService(db)
	stravaService := services.NewStravaService(db, stravaClient, redisClient, calendarService)
	goalsService := services.NewGoalsService(db)
	activityService := services.NewActivityService(db)
	metricsService := services.NewMetricsService(db)
	crossTrainingGoalsService := services.NewCrossTrainingGoalsService(db)
	userProfileService := services.NewUserProfileService(db)
	coachService := services.NewCoachService(db, cfg, goalsService, calendarService, userProfileService)

	// 6. Initialize Handlers
	stravaHandler := handlers.NewStravaHandler(stravaService, cfg.FrontendURL)
	goalsHandler := handlers.NewGoalsHandler(goalsService)
	coachHandler := handlers.NewCoachHandler(coachService, db)
	calendarHandler := handlers.NewCalendarHandler(calendarService)
	profileHandler := handlers.NewProfileHandler(authService, stravaService, goalsService, userProfileService)
	activitiesHandler := handlers.NewActivitiesHandler(activityService)
	dashboardHandler := handlers.NewDashboardHandler(metricsService)
	crossTrainingHandler := handlers.NewCrossTrainingHandler(db)
	gearHandler := handlers.NewGearHandler(db)
	predictorHandler := handlers.NewPredictorHandler(db)
	crossTrainingGoalsHandler := handlers.NewCrossTrainingGoalsHandler(crossTrainingGoalsService)

	// 6. Setup Router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// CORS Configuration
	corsConfig := cors.DefaultConfig()
	origins := strings.Split(cfg.AllowedOrigins, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}
	corsConfig.AllowOrigins = origins
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Static Assets
	r.Static("/uploads", "./uploads")

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
		// Strava OAuth callback (public — Strava redirects here after user approves)
		api.GET("/strava/callback", stravaHandler.Callback)

		// Protected Routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// Strava
			strava := protected.Group("/strava")
			{
				strava.GET("/auth", stravaHandler.AuthURL)
				strava.POST("/sync", stravaHandler.SyncActivities)
				strava.GET("/activities", stravaHandler.GetActivities)
				strava.DELETE("", stravaHandler.Disconnect)
			}

			// Race Goals
			goals := protected.Group("/goals")
			{
				goals.POST("", goalsHandler.CreateGoal)
				goals.GET("", goalsHandler.GetGoals)
				goals.GET("/active", goalsHandler.GetActiveGoal)
				goals.GET("/:id", goalsHandler.GetGoal)
				goals.PUT("/:id", goalsHandler.UpdateGoal)
				goals.PUT("/:id/active", goalsHandler.SetActive)
				goals.PUT("/:id/result", goalsHandler.LogResult)
				goals.DELETE("/:id", goalsHandler.DeleteGoal)
			}

			// AI Coach
			coach := protected.Group("/coach")
			{
				coachLimiter := middleware.CoachRateLimiter(redisClient, db)
				coach.POST("/message", coachLimiter, coachHandler.SendMessage)
				coach.GET("/history", coachHandler.GetConversationHistory)
				coach.GET("/quota", coachHandler.GetQuota)
				coach.GET("/insight", coachLimiter, coachHandler.GetInsight)
				coach.POST("/generate-plan", coachLimiter, coachHandler.GeneratePlan)
				// Sessions
				coach.POST("/sessions", coachHandler.CreateSession)
				coach.GET("/sessions", coachHandler.GetSessions)
				coach.GET("/sessions/:id/messages", coachHandler.GetSessionMessages)
			}

			// Profile / Settings
			profile := protected.Group("/profile")
			{
				profile.GET("", profileHandler.GetProfile)
				profile.PUT("", profileHandler.UpdateProfile)
				profile.DELETE("", profileHandler.DeleteAccount)
				profile.GET("/export", profileHandler.ExportData)
				profile.POST("/avatar", profileHandler.UploadAvatar)

				profile.GET("/prs", profileHandler.GetPersonalRecords)
				profile.PUT("/prs/:label", profileHandler.UpsertPersonalRecord)
				profile.DELETE("/prs/:label", profileHandler.DeletePersonalRecord)
				profile.POST("/prs/detect", profileHandler.DetectPRsFromStrava)

				profile.GET("/zones", profileHandler.GetTrainingZones)
				profile.PUT("/zones", profileHandler.UpdateTrainingZones)
			}

			// Training Calendar
			calendar := protected.Group("/calendar")
			{
				calendar.GET("/week", calendarHandler.GetWeek)
				calendar.GET("/range", calendarHandler.GetRange)
				calendar.POST("/entry", calendarHandler.CreateEntry)
				calendar.PUT("/entry/:id", calendarHandler.UpdateEntry)
				calendar.DELETE("/entry/:id", calendarHandler.DeleteEntry)
				calendar.PATCH("/entry/:id/status", calendarHandler.UpdateStatus)
			}

			// Activities
			protected.POST("/activities", activitiesHandler.CreateActivity)
			protected.GET("/activities", activitiesHandler.GetActivities)
			protected.DELETE("/activities/:id", activitiesHandler.DeleteActivity)

			// Dashboard metrics
			protected.GET("/dashboard", dashboardHandler.Get)

			// Cross-training sessions
			protected.GET("/crosstraining", crossTrainingHandler.List)
			protected.POST("/crosstraining", crossTrainingHandler.Create)
			protected.DELETE("/crosstraining/:id", crossTrainingHandler.Delete)

			// Gear / Shoes
			protected.GET("/gear/shoes", gearHandler.ListShoes)
			protected.POST("/gear/shoes", gearHandler.AddShoe)
			protected.PUT("/gear/shoes/:id", gearHandler.UpdateShoe)
			protected.DELETE("/gear/shoes/:id", gearHandler.DeleteShoe)

			// Race Predictor manual override
			protected.POST("/predictor/manual", predictorHandler.SaveManual)

			// Cross-training goals
			ctg := protected.Group("/cross-training-goals")
			{
				ctg.GET("", crossTrainingGoalsHandler.GetGoals)
				ctg.PUT("", crossTrainingGoalsHandler.UpsertGoal)
				ctg.DELETE("/:id", crossTrainingGoalsHandler.DeleteGoal)
			}
		}
	}

	// Start Server
	log.Printf("Korsana API server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
