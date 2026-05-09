package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	val, exists := c.Get("userID")
	if !exists {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return uuid.Nil, false
	}
	userID, ok := val.(uuid.UUID)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return uuid.Nil, false
	}
	return userID, true
}
