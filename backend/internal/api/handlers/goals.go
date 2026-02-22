package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

type GoalsHandler struct {
	goalsService *services.GoalsService
}

func NewGoalsHandler(goalsService *services.GoalsService) *GoalsHandler {
	return &GoalsHandler{
		goalsService: goalsService,
	}
}

type createGoalRequest struct {
	RaceName          string  `json:"race_name" binding:"required"`
	RaceDate          string  `json:"race_date" binding:"required"` // Format: "2026-01-26"
	RaceDistanceKm    float64 `json:"race_distance_km" binding:"required"`
	TargetTimeSeconds *int    `json:"target_time_seconds"`
	GoalType          string  `json:"goal_type" binding:"required"` // "finish", "time", "pr"
}

func (h *GoalsHandler) CreateGoal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req createGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse race date
	raceDate, err := time.Parse("2006-01-02", req.RaceDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	if req.RaceName == "" || len(req.RaceName) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "race name is required (max 255 chars)"})
		return
	}
	if req.RaceDistanceKm <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "distance must be positive"})
		return
	}
	if req.TargetTimeSeconds != nil && *req.TargetTimeSeconds <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target time must be positive"})
		return
	}
	// Race date should be in the future (for new goals)
	if raceDate.Before(time.Now().Truncate(24 * time.Hour)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "race date must be in the future"})
		return
	}

	// Convert km to meters
	distanceMeters := int(req.RaceDistanceKm * 1000)

	goal, err := h.goalsService.CreateGoal(c.Request.Context(), userID, req.RaceName, raceDate, distanceMeters, req.TargetTimeSeconds, req.GoalType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"goal": goal,
	})
}

func (h *GoalsHandler) GetGoals(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	goals, err := h.goalsService.GetUserGoals(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"goals": goals,
	})
}

func (h *GoalsHandler) GetActiveGoal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	goal, err := h.goalsService.GetActiveGoal(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no active goal found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"goal": goal,
	})
}

func (h *GoalsHandler) GetGoal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	goalID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid goal ID"})
		return
	}

	goal, err := h.goalsService.GetGoalByID(c.Request.Context(), userID, goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"goal": goal,
	})
}

type updateGoalRequest struct {
	RaceName          string  `json:"race_name" binding:"required"`
	RaceDate          string  `json:"race_date" binding:"required"`
	RaceDistanceKm    float64 `json:"race_distance_km" binding:"required"`
	TargetTimeSeconds *int    `json:"target_time_seconds"`
	GoalType          string  `json:"goal_type" binding:"required"`
}

func (h *GoalsHandler) UpdateGoal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	goalID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid goal ID"})
		return
	}

	var req updateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	raceDate, err := time.Parse("2006-01-02", req.RaceDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	if req.RaceName == "" || len(req.RaceName) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "race name is required (max 255 chars)"})
		return
	}
	if req.RaceDistanceKm <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "distance must be positive"})
		return
	}
	if req.TargetTimeSeconds != nil && *req.TargetTimeSeconds <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target time must be positive"})
		return
	}

	distanceMeters := int(req.RaceDistanceKm * 1000)

	goal, err := h.goalsService.UpdateGoal(c.Request.Context(), userID, goalID, req.RaceName, raceDate, distanceMeters, req.TargetTimeSeconds, req.GoalType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"goal": goal,
	})
}

func (h *GoalsHandler) DeleteGoal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	goalID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid goal ID"})
		return
	}

	err = h.goalsService.DeleteGoal(c.Request.Context(), userID, goalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "goal deleted successfully",
	})
}
