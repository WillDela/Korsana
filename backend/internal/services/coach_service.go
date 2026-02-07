package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/korsana/backend/internal/config"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
	"github.com/google/uuid"
)

// CoachService handles AI coaching logic
type CoachService struct {
	db           *database.DB
	config       *config.Config
	httpClient   *http.Client
	goalsService *GoalsService
}

// NewCoachService creates a new coach service
func NewCoachService(db *database.DB, cfg *config.Config, goalsService *GoalsService) *CoachService {
	return &CoachService{
		db:           db,
		config:       cfg,
		httpClient:   &http.Client{Timeout: 30 * time.Second},
		goalsService: goalsService,
	}
}

// ClaudeMessage represents a message in the Claude API format
type ClaudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ClaudeRequest represents the request to Claude API
type ClaudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []ClaudeMessage `json:"messages"`
	System    string          `json:"system,omitempty"`
}

// ClaudeResponse represents the response from Claude API
type ClaudeResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
}

// SendMessage sends a message to the AI coach and gets a response
func (s *CoachService) SendMessage(ctx context.Context, userID uuid.UUID, userMessage string) (string, error) {
	// Build context about user's training
	trainingContext, err := s.buildTrainingContext(ctx, userID)
	if err != nil {
		trainingContext = "No training data available yet."
	}

	// Get recent conversation history (last 10 messages)
	var recentMessages []models.CoachConversation
	query := `
		SELECT * FROM coach_conversations
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 10
	`
	err = s.db.SelectContext(ctx, &recentMessages, query, userID)
	if err != nil {
		recentMessages = []models.CoachConversation{}
	}

	// Reverse to get chronological order
	for i, j := 0, len(recentMessages)-1; i < j; i, j = i+1, j-1 {
		recentMessages[i], recentMessages[j] = recentMessages[j], recentMessages[i]
	}

	// Build messages for Claude
	messages := []ClaudeMessage{}
	for _, msg := range recentMessages {
		messages = append(messages, ClaudeMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// Add current user message
	messages = append(messages, ClaudeMessage{
		Role:    "user",
		Content: userMessage,
	})

	// System prompt
	systemPrompt := fmt.Sprintf(`You are Korsana, an experienced running coach with expertise in marathon and distance running training. You provide evidence-based, personalized advice to runners.

Your coaching philosophy:
- Hybrid approach: Combine established training principles (periodization, 80/20 rule, progressive overload) with personalized recommendations based on individual data
- Never provide generic linear plans - always adapt to the runner's specific situation
- Focus on the "why" behind recommendations, not just the "what"
- Acknowledge limitations and suggest professional medical consultation when appropriate
- Be direct, supportive, and data-informed

Current runner's context:
%s

Provide concise, actionable advice. Keep responses to 2-3 paragraphs unless the runner asks for more detail.`, trainingContext)

	// Choose API based on what's available
	var response string
	if s.config.ClaudeAPIKey != "" {
		response, err = s.callClaudeAPI(messages, systemPrompt)
	} else if s.config.GeminiAPIKey != "" {
		response, err = s.callGeminiAPI(messages, systemPrompt)
	} else {
		return "", errors.New("no AI API key configured")
	}

	if err != nil {
		return "", err
	}

	// Store conversation in database
	userMsg := &models.CoachConversation{
		ID:        uuid.New(),
		UserID:    userID,
		Role:      "user",
		Content:   userMessage,
		CreatedAt: time.Now(),
	}

	assistantMsg := &models.CoachConversation{
		ID:        uuid.New(),
		UserID:    userID,
		Role:      "assistant",
		Content:   response,
		CreatedAt: time.Now(),
	}

	insertQuery := `
		INSERT INTO coach_conversations (id, user_id, role, content, created_at)
		VALUES (:id, :user_id, :role, :content, :created_at)
	`

	_, _ = s.db.NamedExecContext(ctx, insertQuery, userMsg)
	_, _ = s.db.NamedExecContext(ctx, insertQuery, assistantMsg)

	return response, nil
}

// callClaudeAPI calls the Anthropic Claude API
func (s *CoachService) callClaudeAPI(messages []ClaudeMessage, systemPrompt string) (string, error) {
	reqBody := ClaudeRequest{
		Model:     "claude-sonnet-4-5-20250929",
		MaxTokens: 1024,
		Messages:  messages,
		System:    systemPrompt,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", s.config.ClaudeAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("claude API error: %d - %s", resp.StatusCode, string(body))
	}

	var claudeResp ClaudeResponse
	if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil {
		return "", err
	}

	if len(claudeResp.Content) == 0 {
		return "", errors.New("no response from Claude")
	}

	return claudeResp.Content[0].Text, nil
}

// callGeminiAPI calls the Google Gemini API
func (s *CoachService) callGeminiAPI(messages []ClaudeMessage, systemPrompt string) (string, error) {
	// Gemini implementation - simplified for now
	// You would implement the actual Gemini API call here
	return "", errors.New("Gemini API not yet implemented")
}

// buildTrainingContext builds a context string from user's training data
func (s *CoachService) buildTrainingContext(ctx context.Context, userID uuid.UUID) (string, error) {
	// Get active goal
	goal, err := s.goalsService.GetActiveGoal(ctx, userID)
	if err != nil {
		return "", err
	}

	// Get recent activities (last 14 days)
	var activities []models.Activity
	query := `
		SELECT * FROM activities
		WHERE user_id = $1 AND start_time >= NOW() - INTERVAL '14 days'
		ORDER BY start_time DESC
	`
	err = s.db.SelectContext(ctx, &activities, query, userID)
	if err != nil {
		activities = []models.Activity{}
	}

	// Calculate stats
	totalDistance := 0.0
	totalDuration := 0
	runCount := len(activities)

	for _, act := range activities {
		totalDistance += act.DistanceMeters
		totalDuration += act.DurationSeconds
	}

	distanceKm := totalDistance / 1000.0
	avgPace := 0.0
	if totalDistance > 0 {
		avgPace = float64(totalDuration) / (distanceKm)
	}

	// Days until race
	daysUntil := int(time.Until(goal.RaceDate).Hours() / 24)

	contextStr := fmt.Sprintf(`Race Goal: %s on %s (%d days away)
Distance: %.2f km
Target Time: %s
Recent Training (last 14 days):
- Total runs: %d
- Total distance: %.1f km
- Average pace: %.0f seconds/km`,
		goal.RaceName,
		goal.RaceDate.Format("2006-01-02"),
		daysUntil,
		float64(goal.RaceDistanceMeters)/1000.0,
		formatTime(goal.TargetTimeSeconds),
		runCount,
		distanceKm,
		avgPace,
	)

	return contextStr, nil
}

// formatTime formats seconds into HH:MM:SS
func formatTime(seconds *int) string {
	if seconds == nil {
		return "Just finish"
	}
	s := *seconds
	hours := s / 3600
	minutes := (s % 3600) / 60
	secs := s % 60
	return fmt.Sprintf("%d:%02d:%02d", hours, minutes, secs)
}

// GetConversationHistory retrieves the conversation history for a user
func (s *CoachService) GetConversationHistory(ctx context.Context, userID uuid.UUID, limit int) ([]models.CoachConversation, error) {
	if limit == 0 {
		limit = 50
	}

	var messages []models.CoachConversation
	query := `
		SELECT * FROM coach_conversations
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	err := s.db.SelectContext(ctx, &messages, query, userID, limit)
	if err != nil {
		return nil, err
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}
