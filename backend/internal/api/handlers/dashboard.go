package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/services"
)

// DashboardHandler handles dashboard metrics requests.
type DashboardHandler struct {
	metricsService *services.MetricsService
}

// NewDashboardHandler creates a new DashboardHandler.
func NewDashboardHandler(metricsService *services.MetricsService) *DashboardHandler {
	return &DashboardHandler{metricsService: metricsService}
}

// Get handles GET /api/dashboard
func (h *DashboardHandler) Get(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	data, err := h.metricsService.ComputeDashboard(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to compute dashboard metrics"})
		return
	}

	c.JSON(http.StatusOK, data)
}
