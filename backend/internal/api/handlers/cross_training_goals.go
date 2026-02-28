package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

// CrossTrainingGoalsHandler handles cross-training goal HTTP requests
type CrossTrainingGoalsHandler struct {
	svc *services.CrossTrainingGoalsService
}

// NewCrossTrainingGoalsHandler creates a new CrossTrainingGoalsHandler
func NewCrossTrainingGoalsHandler(
	svc *services.CrossTrainingGoalsService,
) *CrossTrainingGoalsHandler {
	return &CrossTrainingGoalsHandler{svc: svc}
}

// GetGoals handles GET /api/cross-training-goals
func (h *CrossTrainingGoalsHandler) GetGoals(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	goals, progress, err := h.svc.GetGoalsWithProgress(
		c.Request.Context(), userID,
	)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{"error": "failed to fetch goals"},
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"goals":           goals,
		"weekly_progress": progress,
	})
}

// UpsertGoal handles PUT /api/cross-training-goals
func (h *CrossTrainingGoalsHandler) UpsertGoal(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req struct {
		ActivityType    string `json:"activity_type"`
		SessionsPerWeek int    `json:"sessions_per_week"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	goal, err := h.svc.UpsertGoal(
		c.Request.Context(), userID,
		req.ActivityType, req.SessionsPerWeek,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"goal": goal})
}

// DeleteGoal handles DELETE /api/cross-training-goals/:id
func (h *CrossTrainingGoalsHandler) DeleteGoal(c *gin.Context) {
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

	if err := h.svc.DeleteGoal(c.Request.Context(), userID, goalID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "goal deleted"})
}
