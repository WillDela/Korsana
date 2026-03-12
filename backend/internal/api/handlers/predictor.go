package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
)

// PredictorHandler handles manual predictor entry requests.
type PredictorHandler struct {
	db *database.DB
}

// NewPredictorHandler creates a new PredictorHandler.
func NewPredictorHandler(db *database.DB) *PredictorHandler {
	return &PredictorHandler{db: db}
}

type saveManualReq struct {
	DistanceLabel string `json:"distance_label" binding:"required"`
	TimeSeconds   int    `json:"time_seconds" binding:"required,min=1"`
	DateRecorded  string `json:"date_recorded" binding:"required"`
}

// SaveManual handles POST /api/predictor/manual (upsert)
func (h *PredictorHandler) SaveManual(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req saveManualReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validDistances := map[string]bool{"5K": true, "10K": true, "half_marathon": true, "marathon": true}
	if !validDistances[req.DistanceLabel] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid distance_label"})
		return
	}

	date, err := time.Parse("2006-01-02", req.DateRecorded)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_recorded format"})
		return
	}

	_, err = h.db.ExecContext(c.Request.Context(), `
		INSERT INTO manual_predictor_entries (id, user_id, distance_label, time_seconds, date_recorded)
		VALUES (gen_random_uuid(), $1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE SET
			distance_label = EXCLUDED.distance_label,
			time_seconds = EXCLUDED.time_seconds,
			date_recorded = EXCLUDED.date_recorded
	`, userID, req.DistanceLabel, req.TimeSeconds, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save entry"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "saved"})
}
