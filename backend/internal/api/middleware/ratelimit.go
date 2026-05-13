package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/logger"
	"github.com/redis/go-redis/v9"
)

const (
	dailyUserLimit   = 10   // per-user daily cap (5–10 as spec'd)
	hourlyUserLimit  = 5    // per-user hourly sub-limit
	globalDailyLimit = 1400 // buffer under Gemini's 1,500 free tier

	insightDailyUserLimit   = 5   // per-user daily insight cap (cached, so rarely hit)
	insightGlobalDailyLimit = 200 // global insight cap, separate from chat budget
)

// CoachRateLimiter enforces AI coach usage limits at two layers:
//   - Redis: fast in-memory counter (primary path)
//   - PostgreSQL: authoritative, tamper-resistant counter (second layer)
//
// PostgreSQL enforces the limit even if Redis is bypassed or evicted.
func CoachRateLimiter(rdb *redis.Client, db *database.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userIDVal, exists := c.Get("userID")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userID, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userIDStr := userID.String()
		today := time.Now().UTC().Format("2006-01-02")

		log := logger.FromContext(ctx)

		// ── 1. Global daily limit (Redis) ────────────────────────────────────
		globalKey := fmt.Sprintf("ratelimit:coach:global:%s", today)
		globalCount, err := rdb.Incr(ctx, globalKey).Result()
		if err != nil {
			log.Warn("Redis error on global check", "error", err)
			// Fail open — don't block if Redis is down, PG layer still protects
		} else {
			if globalCount == 1 {
				rdb.Expire(ctx, globalKey, 25*time.Hour)
			}
			if globalCount > globalDailyLimit {
				log.Warn("Global daily limit reached", "count", globalCount)
				rdb.Decr(ctx, globalKey)
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error": "The AI coach has reached its daily limit. Please try again tomorrow.",
				})
				return
			}
		}

		// ── 2. Per-user hourly limit (Redis) ─────────────────────────────────
		hourKey := fmt.Sprintf("ratelimit:coach:%s:hour", userIDStr)
		hourCount, err := rdb.Incr(ctx, hourKey).Result()
		if err != nil {
			log.Warn("Redis error on hourly check", "error", err)
		} else {
			if hourCount == 1 {
				rdb.Expire(ctx, hourKey, time.Hour)
			}
			if hourCount > hourlyUserLimit {
				log.Warn("User exceeded hourly limit", "user_id", userIDStr, "count", hourCount)
				rdb.Decr(ctx, hourKey)
				rdb.Decr(ctx, globalKey)
				ttl, _ := rdb.TTL(ctx, hourKey).Result()
				minutes := int(ttl.Minutes()) + 1
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error": fmt.Sprintf(
						"You've reached the hourly message limit. Try again in %d minutes.", minutes,
					),
				})
				return
			}
		}

		// ── 3. Per-user daily limit (PostgreSQL — authoritative) ──────────────
		// try_consume_coach_quota atomically checks and increments; returns NULL
		// when the limit is reached. The DB CHECK constraint is a hard backstop.
		var newCount *int
		err = db.QueryRowContext(
			ctx,
			`SELECT try_consume_coach_quota($1::uuid, $2::date)`,
			userID, time.Now().UTC().Format("2006-01-02"),
		).Scan(&newCount)
		if err != nil {
			log.Warn("PG quota check error", "user_id", userIDStr, "error", err)
			// Postgres is unavailable. Try the Redis daily counter as a fallback;
			// if Redis is also down, fail closed — without either backend we
			// cannot enforce the quota and would burn the AI budget instantly.
			dayKey := fmt.Sprintf("ratelimit:coach:%s:%s", userIDStr, today)
			dayCount, rerr := rdb.Incr(ctx, dayKey).Result()
			if rerr != nil {
				log.Error("Both Postgres and Redis unavailable for rate limiting",
					"user_id", userIDStr, "pg_error", err, "redis_error", rerr)
				rdb.Decr(ctx, hourKey)
				rdb.Decr(ctx, globalKey)
				c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
					"error": "AI coach is temporarily unavailable. Please try again shortly.",
				})
				return
			}
			if dayCount == 1 {
				rdb.Expire(ctx, dayKey, 25*time.Hour)
			}
			if dayCount > dailyUserLimit {
				rdb.Decr(ctx, dayKey)
				rdb.Decr(ctx, hourKey)
				rdb.Decr(ctx, globalKey)
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error": fmt.Sprintf(
						"You've used all %d AI questions for today. Check back tomorrow.", dailyUserLimit,
					),
					"limit":     dailyUserLimit,
					"used":      dayCount - 1,
					"remaining": 0,
				})
				return
			}
			setRateLimitHeaders(c, int(dayCount), dailyUserLimit)
			c.Next()
			return
		}

		if newCount == nil {
			// Limit reached — PostgreSQL returned NULL
			var used int
			_ = db.QueryRowContext(
				ctx,
				`SELECT used FROM get_coach_quota($1::uuid, $2::date)`,
				userID, time.Now().UTC().Format("2006-01-02"),
			).Scan(&used)
			rdb.Decr(ctx, hourKey)
			rdb.Decr(ctx, globalKey)
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": fmt.Sprintf(
					"You've used all %d AI questions for today. Check back tomorrow.", dailyUserLimit,
				),
				"limit":     dailyUserLimit,
				"used":      used,
				"remaining": 0,
			})
			return
		}

		setRateLimitHeaders(c, *newCount, dailyUserLimit)
		c.Next()
	}
}

// InsightRateLimiter enforces a Redis-only cap on daily insight generation.
// It does NOT consume the PostgreSQL coach_rate_limits quota used for chat messages.
func InsightRateLimiter(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userIDVal, exists := c.Get("userID")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userID, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userIDStr := userID.String()
		today := time.Now().UTC().Format("2006-01-02")

		log := logger.FromContext(ctx)

		// ── 1. Global daily limit (Redis) ────────────────────────────────────
		globalKey := fmt.Sprintf("ratelimit:insight:global:%s", today)
		globalCount, err := rdb.Incr(ctx, globalKey).Result()
		if err != nil {
			log.Warn("Redis error on insight global check", "error", err)
		} else {
			if globalCount == 1 {
				rdb.Expire(ctx, globalKey, 25*time.Hour)
			}
			if globalCount > insightGlobalDailyLimit {
				rdb.Decr(ctx, globalKey)
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error": "The daily insight limit has been reached. Try again tomorrow.",
				})
				return
			}
		}

		// ── 2. Per-user daily limit (Redis) ──────────────────────────────────
		userKey := fmt.Sprintf("ratelimit:insight:%s:%s", userIDStr, today)
		userCount, err := rdb.Incr(ctx, userKey).Result()
		if err != nil {
			log.Warn("Redis error on insight user check", "error", err)
		} else {
			if userCount == 1 {
				rdb.Expire(ctx, userKey, 25*time.Hour)
			}
			if userCount > insightDailyUserLimit {
				rdb.Decr(ctx, userKey)
				rdb.Decr(ctx, globalKey)
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error": "You've reached the daily insight limit. Try again tomorrow.",
				})
				return
			}
		}

		c.Next()
	}
}

func setRateLimitHeaders(c *gin.Context, used, limit int) {
	remaining := max(0, limit-used)
	reset := time.Now().UTC().Truncate(24 * time.Hour).Add(24 * time.Hour).Unix()
	c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
	c.Header("X-RateLimit-Used", strconv.Itoa(used))
	c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
	c.Header("X-RateLimit-Reset", strconv.FormatInt(reset, 10))
}
