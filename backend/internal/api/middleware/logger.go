package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/korsana/backend/internal/logger"
)

// Logger attaches a request-scoped slog.Logger (with request_id baked in)
// to the request context, then emits a single access-log line when the
// handler returns. Must be installed after RequestID().
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := RequestIDFromContext(c)
		l := slog.Default().With("request_id", rid)
		ctx := logger.WithLogger(c.Request.Context(), l)
		c.Request = c.Request.WithContext(ctx)

		start := time.Now()
		c.Next()
		elapsed := time.Since(start)

		l.Info("request",
			"method", c.Request.Method,
			"path", c.FullPath(),
			"status", c.Writer.Status(),
			"duration_ms", elapsed.Milliseconds(),
			"client_ip", c.ClientIP(),
		)
	}
}
