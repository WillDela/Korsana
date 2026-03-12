package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/services"
)

// CrossTrainingHandler handles cross-training session requests.
type CrossTrainingHandler struct {
	db *database.DB
}

// NewCrossTrainingHandler creates a new CrossTrainingHandler.
func NewCrossTrainingHandler(db *database.DB) *CrossTrainingHandler {
	return &CrossTrainingHandler{db: db}
}

type createCTSessionReq struct {
	Type            string   `json:"type" binding:"required"`
	Date            string   `json:"date" binding:"required"`
	DurationMinutes int      `json:"duration_minutes" binding:"required,min=1"`
	Intensity       *string  `json:"intensity"`
	DistanceMeters  *float64 `json:"distance_meters"`
	Notes           *string  `json:"notes"`
}

// List handles GET /api/crosstraining
func (h *CrossTrainingHandler) List(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	weeks, _ := strconv.Atoi(c.DefaultQuery("weeks", "4"))
	if weeks < 1 || weeks > 52 {
		weeks = 4
	}
	cutoff := time.Now().AddDate(0, 0, -weeks*7)

	var sessions []services.CrossTrainingSession
	err := h.db.SelectContext(c.Request.Context(), &sessions, `
		SELECT id, user_id, type, date, duration_minutes, intensity, distance_meters, notes, source, strava_activity_id, created_at, updated_at
		FROM cross_training_sessions
		WHERE user_id = $1 AND date >= $2
		ORDER BY date DESC
	`, userID, cutoff)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// Create handles POST /api/crosstraining
func (h *CrossTrainingHandler) Create(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req createCTSessionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	id := uuid.New()
	_, err = h.db.ExecContext(c.Request.Context(), `
		INSERT INTO cross_training_sessions
			(id, user_id, type, date, duration_minutes, intensity, distance_meters, notes, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual')
	`, id, userID, req.Type, date, req.DurationMinutes, req.Intensity, req.DistanceMeters, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// Delete handles DELETE /api/crosstraining/:id
func (h *CrossTrainingHandler) Delete(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	result, err := h.db.ExecContext(c.Request.Context(),
		"DELETE FROM cross_training_sessions WHERE id = $1 AND user_id = $2", sessionID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete session"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
