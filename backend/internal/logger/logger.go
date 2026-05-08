// Package logger initializes the application's structured logger and provides
// context-based propagation so per-request fields (like request_id) flow
// through every layer.
package logger

import (
	"context"
	"io"
	"log/slog"
	"os"
)

type ctxKey struct{}

// Init configures the application logger and installs it as slog.Default().
// Production environments emit JSON; everything else emits human-readable
// text with debug level enabled.
//
// w is the writer to send log output to; pass nil for os.Stdout.
func Init(env string, w io.Writer) *slog.Logger {
	if w == nil {
		w = os.Stdout
	}

	level := slog.LevelInfo
	if env != "production" {
		level = slog.LevelDebug
	}

	opts := &slog.HandlerOptions{Level: level}
	var handler slog.Handler
	if env == "production" {
		handler = slog.NewJSONHandler(w, opts)
	} else {
		handler = slog.NewTextHandler(w, opts)
	}

	logger := slog.New(handler)
	slog.SetDefault(logger)
	return logger
}

// FromContext returns the request-scoped logger stored in ctx, falling back
// to slog.Default() if none has been attached. Safe to call with a nil ctx.
func FromContext(ctx context.Context) *slog.Logger {
	if ctx == nil {
		return slog.Default()
	}
	if l, ok := ctx.Value(ctxKey{}).(*slog.Logger); ok && l != nil {
		return l
	}
	return slog.Default()
}

// WithLogger returns a copy of ctx that carries the provided logger so
// downstream code can pull it via FromContext.
func WithLogger(ctx context.Context, l *slog.Logger) context.Context {
	return context.WithValue(ctx, ctxKey{}, l)
}
