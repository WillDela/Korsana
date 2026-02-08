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
