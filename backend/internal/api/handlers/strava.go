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

// AuthURL generates Strava OAuth URL with state parameter
func (h *StravaHandler) AuthURL(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	url, err := h.stravaService.GetAuthURL(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate auth URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// Callback handles the redirect from Strava (public endpoint - no auth required)
func (h *StravaHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.Redirect(http.StatusFound, "http://localhost:5173/settings?strava_error=missing_code")
		return
	}

	if state == "" {
		c.Redirect(http.StatusFound, "http://localhost:5173/settings?strava_error=missing_state")
		return
	}

	// Validate state and get user ID
	userID, err := h.stravaService.ValidateOAuthState(c.Request.Context(), state)
	if err != nil {
		c.Redirect(http.StatusFound, "http://localhost:5173/settings?strava_error=invalid_state")
		return
	}

	// Complete the OAuth flow
	err = h.stravaService.HandleCallback(c.Request.Context(), userID, code)
	if err != nil {
		c.Redirect(http.StatusFound, "http://localhost:5173/settings?strava_error=connection_failed")
		return
	}

	// Redirect back to settings with success
	c.Redirect(http.StatusFound, "http://localhost:5173/settings?strava_connected=true")
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
