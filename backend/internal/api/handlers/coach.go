package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/services"
)

type CoachHandler struct {
	coachService *services.CoachService
	db           *database.DB
}

func NewCoachHandler(coachService *services.CoachService, db *database.DB) *CoachHandler {
	return &CoachHandler{
		coachService: coachService,
		db:           db,
	}
}

type sendMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

func (h *CoachHandler) SendMessage(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req sendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Message) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message too long (max 1000 characters)"})
		return
	}

	response, err := h.coachService.SendMessage(c.Request.Context(), userID, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}

func (h *CoachHandler) GetInsight(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	insight, err := h.coachService.GenerateInsight(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"insight": insight,
	})
}

type generatePlanRequest struct {
	Days    int  `json:"days"`
	Confirm bool `json:"confirm"`
}

// GeneratePlan generates a training plan and optionally writes it to the calendar
// POST /api/coach/generate-plan
func (h *CoachHandler) GeneratePlan(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req generatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Days = 7
	}
	if req.Days <= 0 || req.Days > 14 {
		req.Days = 7
	}

	plan, err := h.coachService.GeneratePlan(c.Request.Context(), userID, req.Days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If confirm is true, write plan to calendar
	if req.Confirm {
		if err := h.coachService.WritePlanToCalendar(c.Request.Context(), userID, plan.Plan); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Plan generated but failed to save to calendar: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"plan":      plan.Plan,
		"summary":   plan.Summary,
		"confirmed": req.Confirm,
	})
}

func (h *CoachHandler) GetConversationHistory(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	messages, err := h.coachService.GetConversationHistory(c.Request.Context(), userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
	})
}

// GetQuota returns today's AI coach quota for the authenticated user without
// consuming any usage. Safe to call on page load for UI display purposes.
func (h *CoachHandler) GetQuota(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var used, limit int
	err := h.db.QueryRowContext(
		c.Request.Context(),
		`SELECT used, limit_val FROM get_coach_quota($1::uuid, $2::date)`,
		userID, time.Now().UTC().Format("2006-01-02"),
	).Scan(&used, &limit)
	if err != nil {
		// Default to full quota on DB error — not a hard failure
		used, limit = 0, 10
	}

	remaining := limit - used
	if remaining < 0 {
		remaining = 0
	}
	reset := time.Now().UTC().Truncate(24*time.Hour).Add(24 * time.Hour).Unix()

	c.JSON(http.StatusOK, gin.H{
		"used":      used,
		"limit":     limit,
		"remaining": remaining,
		"reset_at":  reset,
	})
}
