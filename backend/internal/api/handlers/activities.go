package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

// ActivitiesHandler handles activity-related HTTP requests
type ActivitiesHandler struct {
	activityService *services.ActivityService
}

// NewActivitiesHandler creates a new ActivitiesHandler
func NewActivitiesHandler(
	activityService *services.ActivityService,
) *ActivitiesHandler {
	return &ActivitiesHandler{activityService: activityService}
}

// CreateActivity handles POST /api/activities
func (h *ActivitiesHandler) CreateActivity(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req services.CreateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	activity, err := h.activityService.CreateManualActivity(
		c.Request.Context(), userID, &req,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"activity": activity})
}

// GetActivities handles GET /api/activities
func (h *ActivitiesHandler) GetActivities(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	activityType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "30"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 30
	}
	offset := (page - 1) * perPage

	activities, total, err := h.activityService.GetUserActivities(
		c.Request.Context(), userID, activityType, perPage, offset,
	)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{"error": "failed to fetch activities"},
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"total":      total,
		"page":       page,
		"per_page":   perPage,
	})
}

// DeleteActivity handles DELETE /api/activities/:id
func (h *ActivitiesHandler) DeleteActivity(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	activityIDStr := c.Param("id")
	activityID, err := uuid.Parse(activityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid activity id format"})
		return
	}

	err = h.activityService.DeleteActivity(c.Request.Context(), userID, activityID)
	if err != nil {
		if err.Error() == "activity not found or unauthorized" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete activity"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "activity deleted successfully"})
}
