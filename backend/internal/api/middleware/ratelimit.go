package middleware

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// CoachRateLimiter limits AI coach usage per-user and globally to stay within
// the Gemini free tier (1,500 requests/day) and prevent abuse.
func CoachRateLimiter(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		// Get user ID from auth context
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userID := userIDVal.(uuid.UUID).String()

		// 1. Check global daily limit (1,400/day — buffer under Gemini's 1,500)
		globalKey := fmt.Sprintf("ratelimit:coach:global:%s", time.Now().UTC().Format("2006-01-02"))
		globalCount, err := rdb.Incr(ctx, globalKey).Result()
		if err != nil {
			log.Printf("[RateLimit] Redis error on global check: %v", err)
			c.Next() // fail open — don't block if Redis is down
			return
		}
		if globalCount == 1 {
			rdb.Expire(ctx, globalKey, 25*time.Hour) // expire after the day ends
		}
		if globalCount > 1400 {
			log.Printf("[RateLimit] Global daily limit reached (%d)", globalCount)
			rdb.Decr(ctx, globalKey) // undo the increment
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "The AI coach has reached its daily limit. Please try again tomorrow.",
			})
			return
		}

		// 2. Check per-user hourly limit (10/hour)
		hourKey := fmt.Sprintf("ratelimit:coach:%s:hour", userID)
		hourCount, err := rdb.Incr(ctx, hourKey).Result()
		if err != nil {
			log.Printf("[RateLimit] Redis error on hourly check: %v", err)
			c.Next()
			return
		}
		if hourCount == 1 {
			rdb.Expire(ctx, hourKey, time.Hour)
		}
		if hourCount > 10 {
			log.Printf("[RateLimit] User %s exceeded hourly limit (%d)", userID, hourCount)
			rdb.Decr(ctx, hourKey)
			rdb.Decr(ctx, globalKey) // undo global increment too
			ttl, _ := rdb.TTL(ctx, hourKey).Result()
			minutes := int(ttl.Minutes()) + 1
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": fmt.Sprintf("You've reached the hourly message limit. Try again in %d minutes.", minutes),
			})
			return
		}

		// 3. Check per-user daily limit (50/day)
		dayKey := fmt.Sprintf("ratelimit:coach:%s:%s", userID, time.Now().UTC().Format("2006-01-02"))
		dayCount, err := rdb.Incr(ctx, dayKey).Result()
		if err != nil {
			log.Printf("[RateLimit] Redis error on daily check: %v", err)
			c.Next()
			return
		}
		if dayCount == 1 {
			rdb.Expire(ctx, dayKey, 25*time.Hour)
		}
		if dayCount > 50 {
			log.Printf("[RateLimit] User %s exceeded daily limit (%d)", userID, dayCount)
			rdb.Decr(ctx, dayKey)
			rdb.Decr(ctx, hourKey)
			rdb.Decr(ctx, globalKey)
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "You've reached the daily message limit (50). Try again tomorrow.",
			})
			return
		}

		c.Next()
	}
}
