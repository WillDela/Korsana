package handlers

import (
	"net/http"

	"github.com/korsana/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StravaHandler struct {
	stravaService *services.StravaService
}

func NewStravaHandler(stravaService *services.StravaService) *StravaHandler {
	return &StravaHandler{
		stravaService: stravaService,
	}
}

// AuthURL redirects the user to Strava's OAuth page
func (h *StravaHandler) AuthURL(c *gin.Context) {
	url := h.stravaService.GetAuthURL()
	c.JSON(http.StatusOK, gin.H{"url": url})
}

// Callback handles the redirect from Strava
func (h *StravaHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code param"})
		return
	}

	// In a real app, we'd get the user ID from the context (auth middleware)
	// For MVP Step 1 (getting connection working), we might need to handle this differently
	// But let's assume the user is logged in.
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	err := h.stravaService.HandleCallback(c.Request.Context(), userID, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Redirect back to frontend
	c.Redirect(http.StatusFound, "http://localhost:5173/dashboard?strava_connected=true")
}

// SyncActivities syncs activities from Strava
func (h *StravaHandler) SyncActivities(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	count, err := h.stravaService.SyncActivities(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "activities synced successfully",
		"count":   count,
	})
}

// GetActivities retrieves user's activities
func (h *StravaHandler) GetActivities(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	activities, err := h.stravaService.GetUserActivities(c.Request.Context(), userID, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
	})
}
