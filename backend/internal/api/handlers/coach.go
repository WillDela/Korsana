package handlers

import (
	"net/http"

	"github.com/korsana/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CoachHandler struct {
	coachService *services.CoachService
}

func NewCoachHandler(coachService *services.CoachService) *CoachHandler {
	return &CoachHandler{
		coachService: coachService,
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
