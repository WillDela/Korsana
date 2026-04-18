package handlers

import (
	"errors"
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
	return &CoachHandler{coachService: coachService, db: db}
}

// ── Sessions ─────────────────────────────────────────────────────────────────

func (h *CoachHandler) CreateSession(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	session, err := h.coachService.CreateSession(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"session": session})
}

func (h *CoachHandler) GetSessions(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	sessions, err := h.coachService.GetSessions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

func (h *CoachHandler) GetSessionMessages(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}
	messages, err := h.coachService.GetSessionMessages(c.Request.Context(), userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// ── Messages ──────────────────────────────────────────────────────────────────

type sendMessageRequest struct {
	Message   string  `json:"message" binding:"required"`
	SessionID *string `json:"session_id"`
	Mode      string  `json:"mode"` // "copilot" | "guide" (defaults to "copilot")
}

func (h *CoachHandler) SendMessage(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	var req sendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.Message) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message too long (max 1000 characters)"})
		return
	}
	var sessionID *uuid.UUID
	if req.SessionID != nil && *req.SessionID != "" {
		parsed, err := uuid.Parse(*req.SessionID)
		if err == nil {
			sessionID = &parsed
		}
	}

	response, artifact, evidence, sessionTitle, err := h.coachService.SendMessage(c.Request.Context(), userID, sessionID, req.Message, req.Mode)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCoachMode) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := gin.H{"response": response}
	if artifact != nil {
		result["artifact"] = artifact
	}
	if len(evidence) > 0 {
		result["evidence"] = evidence
	}
	if sessionTitle != "" {
		result["session_title"] = sessionTitle
	}
	c.JSON(http.StatusOK, result)
}

func (h *CoachHandler) GetConversationHistory(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	messages, err := h.coachService.GetConversationHistory(c.Request.Context(), userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// ── Plan ──────────────────────────────────────────────────────────────────────

type generatePlanRequest struct {
	Days    int  `json:"days"`
	Confirm bool `json:"confirm"`
}

func (h *CoachHandler) GeneratePlan(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
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
	if req.Confirm {
		if err := h.coachService.WritePlanToCalendar(c.Request.Context(), userID, plan.Plan); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Plan generated but failed to save: " + err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"plan": plan.Plan, "summary": plan.Summary, "confirmed": req.Confirm})
}

func (h *CoachHandler) GetInsight(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	insight, err := h.coachService.GenerateInsight(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"insight": insight})
}

// ── Quota ─────────────────────────────────────────────────────────────────────

func (h *CoachHandler) GetQuota(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}
	var used, limit int
	err := h.db.QueryRowContext(
		c.Request.Context(),
		`SELECT used, limit_val FROM get_coach_quota($1::uuid, $2::date)`,
		userID, time.Now().UTC().Format("2006-01-02"),
	).Scan(&used, &limit)
	if err != nil {
		used, limit = 0, 10
	}
	remaining := limit - used
	if remaining < 0 {
		remaining = 0
	}
	reset := time.Now().UTC().Truncate(24 * time.Hour).Add(24 * time.Hour).Unix()
	c.JSON(http.StatusOK, gin.H{
		"used": used, "limit": limit, "remaining": remaining, "reset_at": reset,
	})
}

// ── Helper ────────────────────────────────────────────────────────────────────

func mustUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return uuid.UUID{}, false
	}
	return val.(uuid.UUID), true
}
