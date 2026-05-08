package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequestIDHeader is the HTTP header used for request correlation.
const RequestIDHeader = "X-Request-ID"

const requestIDContextKey = "request_id"

// RequestID assigns each request a unique ID. If the inbound request
// already carries an X-Request-ID header (e.g. from an upstream proxy or
// distributed-tracing system), that value is honoured so traces can be
// stitched together across service boundaries.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := c.GetHeader(RequestIDHeader)
		if rid == "" {
			rid = uuid.NewString()
		}
		c.Set(requestIDContextKey, rid)
		c.Header(RequestIDHeader, rid)
		c.Next()
	}
}

// RequestIDFromContext returns the X-Request-ID value attached by the
// RequestID middleware, or "" if absent.
func RequestIDFromContext(c *gin.Context) string {
	v, ok := c.Get(requestIDContextKey)
	if !ok {
		return ""
	}
	s, _ := v.(string)
	return s
}
