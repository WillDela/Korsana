package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

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
	userID, ok := RequireUserID(c)
	if !ok {
		return
	}

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
	userID, ok := RequireUserID(c)
	if !ok {
		return
	}

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
		RespondError(c, http.StatusInternalServerError, "failed to load activities", err)
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
	userID, ok := RequireUserID(c)
	if !ok {
		return
	}

	activityID, ok := ParseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := h.activityService.DeleteActivity(c.Request.Context(), userID, activityID); err != nil {
		if errors.Is(err, services.ErrActivityNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			RespondError(c, http.StatusInternalServerError, "failed to delete activity", err)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "activity deleted successfully"})
}
