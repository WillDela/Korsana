package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/korsana/backend/internal/api/middleware"
	"github.com/korsana/backend/internal/logger"
)

// RequireUserID extracts the authenticated user ID set by AuthMiddleware.
// It performs a checked type assertion and writes a 401 response on
// failure (missing key or unexpected type), so handlers can safely call:
//
//	userID, ok := RequireUserID(c)
//	if !ok {
//	    return
//	}
func RequireUserID(c *gin.Context) (uuid.UUID, bool) {
	val, _ := c.Get("userID")
	userID, ok := val.(uuid.UUID)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return uuid.Nil, false
	}
	return userID, true
}

// ParseUUIDParam reads a UUID from the named path parameter. It writes a
// 400 response with a consistent message and returns ok=false when the
// value is missing or malformed.
//
//	id, ok := ParseUUIDParam(c, "id")
//	if !ok {
//	    return
//	}
func ParseUUIDParam(c *gin.Context, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(name))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("invalid %s", name),
		})
		return uuid.Nil, false
	}
	return id, true
}

// RespondError logs the underlying error against the request-scoped
// logger (which already carries request_id) and writes a generic
// message plus the request ID back to the client. Use this instead of
// echoing err.Error() directly so internal details — schema names,
// file paths, raw SQL — never leak to API consumers.
//
// status should be a 5xx code; for 4xx use c.JSON with a curated message.
func RespondError(c *gin.Context, status int, message string, err error) {
	if err != nil {
		logger.FromContext(c.Request.Context()).Error("handler error",
			"status", status,
			"message", message,
			"path", c.FullPath(),
			"error", err.Error(),
		)
	}
	body := gin.H{"error": message}
	if rid := middleware.RequestIDFromContext(c); rid != "" {
		body["request_id"] = rid
	}
	c.AbortWithStatusJSON(status, body)
}
