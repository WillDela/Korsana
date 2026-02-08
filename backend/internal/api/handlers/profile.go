package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

type ProfileHandler struct {
	authService   *services.AuthService
	stravaService *services.StravaService
	goalsService  *services.GoalsService
}

func NewProfileHandler(authService *services.AuthService, stravaService *services.StravaService, goalsService *services.GoalsService) *ProfileHandler {
	return &ProfileHandler{
		authService:   authService,
		stravaService: stravaService,
		goalsService:  goalsService,
	}
}

// GetProfile returns aggregated user profile data
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	// Get user info
	user, err := h.authService.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Check Strava connection
	stravaConnected := false
	stravaAthleteID := int64(0)
	conn, err := h.stravaService.GetConnection(c.Request.Context(), userID)
	if err == nil && conn != nil {
		stravaConnected = true
		stravaAthleteID = conn.StravaAthleteID
	}

	// Get active goal
	var goalInfo map[string]interface{}
	goal, err := h.goalsService.GetActiveGoal(c.Request.Context(), userID)
	if err == nil && goal != nil {
		goalInfo = map[string]interface{}{
			"id":        goal.ID,
			"race_name": goal.RaceName,
			"race_date": goal.RaceDate,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		},
		"strava": gin.H{
			"connected":  stravaConnected,
			"athlete_id": stravaAthleteID,
		},
		"active_goal": goalInfo,
	})
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required,min=6"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// ChangePassword updates the user's password
func (h *ProfileHandler) ChangePassword(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.authService.ChangePassword(c.Request.Context(), userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
