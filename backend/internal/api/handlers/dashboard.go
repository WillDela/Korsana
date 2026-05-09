package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

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
	userID, ok := RequireUserID(c)
	if !ok {
		return
	}

	data, err := h.metricsService.ComputeDashboard(c.Request.Context(), userID)
	if err != nil {
		RespondError(c, http.StatusInternalServerError, "failed to compute dashboard", err)
		return
	}

	c.JSON(http.StatusOK, data)
}
