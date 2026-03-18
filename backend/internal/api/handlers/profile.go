package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/models"
	"github.com/korsana/backend/internal/services"
)

type ProfileHandler struct {
	authService        *services.AuthService
	stravaService      *services.StravaService
	goalsService       *services.GoalsService
	userProfileService *services.UserProfileService
}

func NewProfileHandler(
	authService *services.AuthService,
	stravaService *services.StravaService,
	goalsService *services.GoalsService,
	userProfileService *services.UserProfileService,
) *ProfileHandler {
	return &ProfileHandler{
		authService:        authService,
		stravaService:      stravaService,
		goalsService:       goalsService,
		userProfileService: userProfileService,
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

	user, _ := h.authService.GetUserByID(c.Request.Context(), userID)

	stravaConnected := false
	stravaAthleteID := int64(0)
	conn, err := h.stravaService.GetConnection(c.Request.Context(), userID)
	if err == nil && conn != nil {
		stravaConnected = true
		stravaAthleteID = conn.StravaAthleteID
	}

	var goalInfo map[string]any
	goal, err := h.goalsService.GetActiveGoal(c.Request.Context(), userID)
	if err == nil && goal != nil {
		goalInfo = map[string]any{
			"id":        goal.ID,
			"race_name": goal.RaceName,
			"race_date": goal.RaceDate,
		}
	}

	profile, err := h.userProfileService.GetOrCreateProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile"})
		return
	}

	prs, _ := h.userProfileService.GetPersonalRecords(c.Request.Context(), userID)

	weeklySummary, _ := h.userProfileService.GetCurrentWeekSummary(c.Request.Context(), userID)

	userInfo := gin.H{"id": userID, "email": "", "created_at": nil}
	if user != nil {
		userInfo = gin.H{"id": user.ID, "email": user.Email, "created_at": user.CreatedAt}
	}

	c.JSON(http.StatusOK, gin.H{
		"user": userInfo,
		"strava": gin.H{
			"connected":  stravaConnected,
			"athlete_id": stravaAthleteID,
		},
		"active_goal":      goalInfo,
		"profile":          profile,
		"personal_records": prs,
		"weekly_summary":   weeklySummary,
	})
}

// UpdateProfile
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)

	var req models.UserProfile
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.UserID = userID

	updated, err := h.userProfileService.UpdateProfile(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// UploadAvatar
func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)

	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "avatar file is required"})
		return
	}

	urlPath, err := h.userProfileService.SaveAvatar(userID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save avatar"})
		return
	}

	profile, err := h.userProfileService.GetOrCreateProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile for update"})
		return
	}
	profile.ProfilePictureURL = &urlPath
	if _, err := h.userProfileService.UpdateProfile(c.Request.Context(), profile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save avatar URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": urlPath})
}

// GetPersonalRecords
func (h *ProfileHandler) GetPersonalRecords(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)

	prs, err := h.userProfileService.GetPersonalRecords(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"prs": prs})
}

// UpsertPersonalRecord
func (h *ProfileHandler) UpsertPersonalRecord(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)
	label := c.Param("label")

	var pr models.PersonalRecord
	if err := c.ShouldBindJSON(&pr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pr.UserID = userID
	pr.Label = label

	if err := h.userProfileService.UpsertPersonalRecord(c.Request.Context(), &pr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "personal record upserted"})
}

// DeletePersonalRecord
func (h *ProfileHandler) DeletePersonalRecord(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)
	label := c.Param("label")

	if err := h.userProfileService.DeletePersonalRecord(c.Request.Context(), userID, label); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "personal record deleted"})
}

// DetectPRsFromStrava
func (h *ProfileHandler) DetectPRsFromStrava(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)

	count, err := h.userProfileService.DetectPRsFromStrava(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	msg := "PR scan complete"
	if count == 0 {
		msg = "No new PRs found. Make sure your activities include standard race distances (5K, 10K, half, or full marathon)."
	}
	c.JSON(http.StatusOK, gin.H{"detected_count": count, "message": msg})
}

// GetTrainingZones
func (h *ProfileHandler) GetTrainingZones(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)
	zoneType := c.Query("type")

	if zoneType != "hr" && zoneType != "pace" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be hr or pace"})
		return
	}

	zones, err := h.userProfileService.GetTrainingZones(c.Request.Context(), userID, zoneType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"zones": zones})
}

// UpdateTrainingZones
func (h *ProfileHandler) UpdateTrainingZones(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uuid.UUID)
	zoneType := c.Query("type")

	if zoneType != "hr" && zoneType != "pace" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be hr or pace"})
		return
	}

	var req []models.TrainingZone
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.userProfileService.SaveManualZones(c.Request.Context(), userID, zoneType, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "training zones updated"})
}

// DeleteAccount deletes the user account
func (h *ProfileHandler) DeleteAccount(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	err := h.authService.DeleteUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account deleted successfully"})
}

// ExportData exports all user data as JSON
func (h *ProfileHandler) ExportData(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	user, _ := h.authService.GetUserByID(c.Request.Context(), userID)
	profile, _ := h.userProfileService.GetOrCreateProfile(c.Request.Context(), userID)
	prs, _ := h.userProfileService.GetPersonalRecords(c.Request.Context(), userID)
	zonesHR, _ := h.userProfileService.GetTrainingZones(c.Request.Context(), userID, "hr")
	zonesPace, _ := h.userProfileService.GetTrainingZones(c.Request.Context(), userID, "pace")
	goals, _ := h.goalsService.GetActiveGoal(c.Request.Context(), userID)

	exportData := gin.H{
		"user":             user,
		"profile":          profile,
		"personal_records": prs,
		"training_zones": gin.H{
			"hr":   zonesHR,
			"pace": zonesPace,
		},
		"active_goal": goals,
	}

	c.Header("Content-Disposition", "attachment; filename=\"korsana-data.json\"")
	c.JSON(http.StatusOK, exportData)
}
