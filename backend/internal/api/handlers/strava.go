package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

type StravaHandler struct {
	stravaService *services.StravaService
	authService   *services.AuthService
}

func NewStravaHandler(stravaService *services.StravaService, authService *services.AuthService) *StravaHandler {
	return &StravaHandler{
		stravaService: stravaService,
		authService:   authService,
	}
}

// LoginRedirect redirects unauthenticated users to the Strava OAuth page.
func (h *StravaHandler) LoginRedirect(c *gin.Context) {
	authURL, err := h.stravaService.GetLoginURL(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate auth URL"})
		return
	}
	c.Redirect(http.StatusFound, authURL)
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

// Callback handles the redirect from Strava (public endpoint - no auth required).
// It handles two flows: unauthenticated login/signup (login state) and
// connecting Strava to an existing account (connect state).
func (h *StravaHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.Redirect(http.StatusFound, "http://localhost:5174/login?strava_error=missing_code")
		return
	}

	if state == "" {
		c.Redirect(http.StatusFound, "http://localhost:5174/login?strava_error=missing_state")
		return
	}

	// Try login flow first (unauthenticated Strava login/signup).
	if err := h.stravaService.ValidateLoginOAuthState(c.Request.Context(), state); err == nil {
		user, isNew, loginErr := h.stravaService.LoginWithStrava(c.Request.Context(), code)
		if loginErr != nil {
			c.Redirect(http.StatusFound, "http://localhost:5174/login?strava_error=login_failed")
			return
		}

		token, tokenErr := h.authService.GenerateToken(user.ID, user.Email)
		if tokenErr != nil {
			c.Redirect(http.StatusFound, "http://localhost:5174/login?strava_error=token_failed")
			return
		}

		newParam := "false"
		if isNew {
			newParam = "true"
		}
		c.Redirect(http.StatusFound,
			"http://localhost:5174/auth/strava/callback?token="+token+"&new="+newParam)
		return
	}

	// Fall through to the authenticated connect flow.
	userID, err := h.stravaService.ValidateOAuthState(c.Request.Context(), state)
	if err != nil {
		c.Redirect(http.StatusFound, "http://localhost:5174/settings?strava_error=invalid_state")
		return
	}

	if err = h.stravaService.HandleCallback(c.Request.Context(), userID, code); err != nil {
		c.Redirect(http.StatusFound, "http://localhost:5174/settings?strava_error=connection_failed")
		return
	}

	c.Redirect(http.StatusFound, "http://localhost:5174/settings?strava_connected=true")
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

// Disconnect removes the Strava connection
func (h *StravaHandler) Disconnect(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	err := h.stravaService.DisconnectStrava(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to disconnect Strava"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Strava disconnected successfully"})
}
