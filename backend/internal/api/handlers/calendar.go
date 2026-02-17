package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/models"
	"github.com/korsana/backend/internal/services"
)

type CalendarHandler struct {
	calendarService *services.CalendarService
}

func NewCalendarHandler(calendarService *services.CalendarService) *CalendarHandler {
	return &CalendarHandler{
		calendarService: calendarService,
	}
}

// GetWeek returns calendar entries for a 7-day period
// GET /api/calendar/week?start=2026-02-09
func (h *CalendarHandler) GetWeek(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	startStr := c.Query("start")
	if startStr == "" {
		// Default to current week's Monday
		now := time.Now()
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		monday := now.AddDate(0, 0, -(weekday - 1))
		startStr = monday.Format("2006-01-02")
	}

	weekStart, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	entries, err := h.calendarService.GetWeekEntries(c.Request.Context(), userID, weekStart)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entries":    entries,
		"week_start": weekStart.Format("2006-01-02"),
	})
}

type upsertEntryRequest struct {
	Date                   string  `json:"date" binding:"required"`
	WorkoutType            string  `json:"workout_type" binding:"required"`
	Title                  string  `json:"title" binding:"required"`
	Description            *string `json:"description"`
	PlannedDistanceMeters  *int    `json:"planned_distance_meters"`
	PlannedDurationMinutes *int    `json:"planned_duration_minutes"`
	PlannedPacePerKm       *int    `json:"planned_pace_per_km"`
	Status                 string  `json:"status"`
}

// UpsertEntry creates or updates a calendar entry
// PUT /api/calendar/entry
func (h *CalendarHandler) UpsertEntry(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req upsertEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entryDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	// Validate workout type
	validTypes := map[string]bool{
		"easy": true, "tempo": true, "interval": true,
		"long": true, "recovery": true, "rest": true, "race": true,
		"cross_train": true,
	}
	if !validTypes[req.WorkoutType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workout_type"})
		return
	}

	status := req.Status
	if status == "" {
		status = "planned"
	}

	entry := &models.CalendarEntry{
		Date:                   entryDate,
		WorkoutType:            req.WorkoutType,
		Title:                  req.Title,
		Description:            req.Description,
		PlannedDistanceMeters:  req.PlannedDistanceMeters,
		PlannedDurationMinutes: req.PlannedDurationMinutes,
		PlannedPacePerKm:       req.PlannedPacePerKm,
		Status:                 status,
	}

	result, err := h.calendarService.UpsertEntry(c.Request.Context(), userID, entry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entry": result,
	})
}

// DeleteEntry deletes a calendar entry
// DELETE /api/calendar/entry/:id
func (h *CalendarHandler) DeleteEntry(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	entryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry ID"})
		return
	}

	err = h.calendarService.DeleteEntry(c.Request.Context(), userID, entryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "entry deleted successfully",
	})
}

type updateStatusRequest struct {
	Status     string  `json:"status" binding:"required"`
	ActivityID *string `json:"activity_id"`
}

// UpdateStatus updates the status of a calendar entry
// PATCH /api/calendar/entry/:id/status
func (h *CalendarHandler) UpdateStatus(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	entryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entry ID"})
		return
	}

	var req updateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var activityID *uuid.UUID
	if req.ActivityID != nil {
		parsed, err := uuid.Parse(*req.ActivityID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid activity_id"})
			return
		}
		activityID = &parsed
	}

	entry, err := h.calendarService.UpdateStatus(c.Request.Context(), userID, entryID, req.Status, activityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"entry": entry,
	})
}
