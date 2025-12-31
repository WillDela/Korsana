package services

import (
	"context"
	"errors"
	"time"

	"github.com/allinrun/backend/internal/config"
	"github.com/allinrun/backend/internal/database"
	"github.com/allinrun/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication logic
type AuthService struct {
	db     *database.DB
	config *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(db *database.DB, cfg *config.Config) *AuthService {
	return &AuthService{
		db:     db,
		config: cfg,
	}
}

// Signup creates a new user
func (s *AuthService) Signup(ctx context.Context, email, password string) (*models.User, error) {
	// 1. Check if user exists
	var count int
	err := s.db.GetContext(ctx, &count, "SELECT COUNT(*) FROM users WHERE email = $1", email)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("email already registered")
	}

	// 2. Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 3. Create user
	user := &models.User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	query := `
		INSERT INTO users (id, email, password_hash, created_at, updated_at)
		VALUES (:id, :email, :password_hash, :created_at, :updated_at)
	`
	_, err = s.db.NamedExecContext(ctx, query, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Login validates credentials and returns a JWT
func (s *AuthService) Login(ctx context.Context, email, password string) (string, *models.User, error) {
	// 1. Find user
	var user models.User
	err := s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE email = $1", email)
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	// 2. Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	// 3. Generate Token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return "", nil, err
	}

	return token, &user, nil
}

// generateToken creates a JWT token
func (s *AuthService) generateToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}
