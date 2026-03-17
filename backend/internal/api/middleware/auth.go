package middleware

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/config"
)

// jwkSet is the JSON structure returned by Supabase's JWKS endpoint.
type jwkSet struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

// keyCache holds parsed EC public keys fetched from the JWKS endpoint.
var (
	keyCacheMu  sync.RWMutex
	keyCache    map[string]*ecdsa.PublicKey
	keyCachedAt time.Time
	keyCacheTTL = 5 * time.Minute
)

func fetchJWKS(supabaseURL string) (map[string]*ecdsa.PublicKey, error) {
	url := strings.TrimRight(supabaseURL, "/") + "/auth/v1/.well-known/jwks.json"
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		return nil, fmt.Errorf("fetching JWKS: %w", err)
	}
	defer resp.Body.Close()

	var set jwkSet
	if err := json.NewDecoder(resp.Body).Decode(&set); err != nil {
		return nil, fmt.Errorf("decoding JWKS: %w", err)
	}

	keys := make(map[string]*ecdsa.PublicKey, len(set.Keys))
	for _, k := range set.Keys {
		if k.Kty != "EC" || k.Crv != "P-256" {
			continue
		}
		xBytes, xerr := base64.RawURLEncoding.DecodeString(k.X)
		yBytes, yerr := base64.RawURLEncoding.DecodeString(k.Y)
		if xerr != nil || yerr != nil {
			continue
		}
		keys[k.Kid] = &ecdsa.PublicKey{
			Curve: elliptic.P256(),
			X:     new(big.Int).SetBytes(xBytes),
			Y:     new(big.Int).SetBytes(yBytes),
		}
	}
	return keys, nil
}

func getPublicKey(supabaseURL, kid string) (*ecdsa.PublicKey, error) {
	keyCacheMu.RLock()
	if keyCache != nil && time.Since(keyCachedAt) < keyCacheTTL {
		key, ok := keyCache[kid]
		keyCacheMu.RUnlock()
		if ok {
			return key, nil
		}
	} else {
		keyCacheMu.RUnlock()
	}

	keys, err := fetchJWKS(supabaseURL)
	if err != nil {
		return nil, err
	}

	keyCacheMu.Lock()
	keyCache = keys
	keyCachedAt = time.Now()
	keyCacheMu.Unlock()

	key, ok := keys[kid]
	if !ok {
		return nil, fmt.Errorf("no key found for kid %q", kid)
	}
	return key, nil
}

// AuthMiddleware validates Supabase JWTs signed with ECC P-256 (ES256).
// Public keys are fetched from Supabase's JWKS endpoint and cached for 5 minutes.
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			kid, _ := token.Header["kid"].(string)
			return getPublicKey(cfg.SupabaseURL, kid)
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		userIDStr, ok := claims["sub"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			return
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
