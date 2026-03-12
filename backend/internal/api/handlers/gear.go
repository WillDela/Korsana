package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/services"
)

// GearHandler handles shoe/gear requests.
type GearHandler struct {
	db *database.DB
}

// NewGearHandler creates a new GearHandler.
func NewGearHandler(db *database.DB) *GearHandler {
	return &GearHandler{db: db}
}

type addShoeReq struct {
	Name          string  `json:"name" binding:"required"`
	Brand         *string `json:"brand"`
	MaxMiles      *int    `json:"max_miles"`
	DatePurchased *string `json:"date_purchased"`
	IsPrimary     bool    `json:"is_primary"`
	UsageLabel    *string `json:"usage_label"`
}

type updateShoeReq struct {
	Name       *string `json:"name"`
	Brand      *string `json:"brand"`
	MaxMiles   *int    `json:"max_miles"`
	IsPrimary  *bool   `json:"is_primary"`
	UsageLabel *string `json:"usage_label"`
	IsActive   *bool   `json:"is_active"`
}

// ListShoes handles GET /api/gear/shoes
func (h *GearHandler) ListShoes(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var shoes []services.GearShoe
	err := h.db.SelectContext(c.Request.Context(), &shoes, `
		SELECT id, user_id, name, brand, max_miles, date_purchased, is_primary, usage_label, is_active, created_at, updated_at
		FROM gear_shoes
		WHERE user_id = $1
		ORDER BY is_primary DESC, created_at ASC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch shoes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"shoes": shoes})
}

// AddShoe handles POST /api/gear/shoes
func (h *GearHandler) AddShoe(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	var req addShoeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	maxMiles := 450
	if req.MaxMiles != nil {
		maxMiles = *req.MaxMiles
	}

	var datePurchased *time.Time
	if req.DatePurchased != nil && *req.DatePurchased != "" {
		t, err := time.Parse("2006-01-02", *req.DatePurchased)
		if err == nil {
			datePurchased = &t
		}
	}

	id := uuid.New()
	_, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO gear_shoes (id, user_id, name, brand, max_miles, date_purchased, is_primary, usage_label)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, id, userID, req.Name, req.Brand, maxMiles, datePurchased, req.IsPrimary, req.UsageLabel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add shoe"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// UpdateShoe handles PUT /api/gear/shoes/:id
func (h *GearHandler) UpdateShoe(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	shoeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid shoe id"})
		return
	}

	var req updateShoeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.ExecContext(c.Request.Context(), `
		UPDATE gear_shoes SET
			name = COALESCE($1, name),
			brand = COALESCE($2, brand),
			max_miles = COALESCE($3, max_miles),
			is_primary = COALESCE($4, is_primary),
			usage_label = COALESCE($5, usage_label),
			is_active = COALESCE($6, is_active),
			updated_at = NOW()
		WHERE id = $7 AND user_id = $8
	`, req.Name, req.Brand, req.MaxMiles, req.IsPrimary, req.UsageLabel, req.IsActive, shoeID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update shoe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// DeleteShoe handles DELETE /api/gear/shoes/:id
func (h *GearHandler) DeleteShoe(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	shoeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid shoe id"})
		return
	}

	result, err := h.db.ExecContext(c.Request.Context(),
		"DELETE FROM gear_shoes WHERE id = $1 AND user_id = $2", shoeID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete shoe"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "shoe not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
