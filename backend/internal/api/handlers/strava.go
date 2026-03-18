package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

type StravaHandler struct {
	stravaService *services.StravaService
	frontendURL   string
}

func NewStravaHandler(stravaService *services.StravaService, frontendURL string) *StravaHandler {
	return &StravaHandler{
		stravaService: stravaService,
		frontendURL:   frontendURL,
	}
}

// AuthURL generates a Strava OAuth URL with a per-user state parameter.
// Called from the authenticated Settings page.
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

// Callback handles the redirect from Strava after the user approves the connection.
// This is the "connect existing account" flow only — Strava is a data source, not
// an identity provider.
func (h *StravaHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.Redirect(http.StatusFound, h.frontendURL+"/settings?strava_error=missing_code")
		return
	}
	if state == "" {
		c.Redirect(http.StatusFound, h.frontendURL+"/settings?strava_error=missing_state")
		return
	}

	userID, err := h.stravaService.ValidateOAuthState(c.Request.Context(), state)
	if err != nil {
		c.Redirect(http.StatusFound, h.frontendURL+"/settings?strava_error=invalid_state")
		return
	}

	if err = h.stravaService.HandleCallback(c.Request.Context(), userID, code); err != nil {
		c.Redirect(http.StatusFound, h.frontendURL+"/settings?strava_error=connection_failed")
		return
	}

	c.Redirect(http.StatusFound, h.frontendURL+"/settings?strava_connected=true")
}

// SyncActivities syncs activities from Strava for the authenticated user.
func (h *StravaHandler) SyncActivities(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 90*time.Second)
	defer cancel()

	count, err := h.stravaService.SyncActivities(ctx, userID)
	if err != nil {
		if err.Error() == "strava connection not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Strava is not connected. Connect it from Settings first."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "activities synced successfully",
		"count":   count,
	})
}

// GetActivities retrieves the user's synced activities with pagination.
func (h *StravaHandler) GetActivities(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "30"))

	if perPage > 100 {
		perPage = 100
	}
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * perPage

	activities, total, err := h.stravaService.GetUserActivities(c.Request.Context(), userID, perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"total":      total,
		"page":       page,
		"per_page":   perPage,
	})
}

// Disconnect removes the Strava connection for the authenticated user.
func (h *StravaHandler) Disconnect(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	if err := h.stravaService.DisconnectStrava(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to disconnect Strava"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Strava disconnected successfully"})
}
