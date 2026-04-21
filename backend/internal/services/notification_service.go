package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/smtp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

var (
	ErrNotificationTypeUnsupported = errors.New("unsupported notification type")
	ErrEmailNotConfigured          = errors.New("email notifications are not configured on this environment")
)

type notificationQuerier interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	SelectContext(ctx context.Context, dest any, query string, args ...any) error
}

type NotificationService struct {
	db            notificationQuerier
	frontendURL   string
	smtpHost      string
	smtpPort      string
	smtpUsername  string
	smtpPassword  string
	smtpFromEmail string
	smtpFromName  string
	sendEmailFn   func(to, subject, body string) error
}

func NewNotificationService(db *database.DB, frontendURL, smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFromEmail, smtpFromName string) *NotificationService {
	svc := &NotificationService{
		db:            db,
		frontendURL:   strings.TrimRight(strings.TrimSpace(frontendURL), "/"),
		smtpHost:      strings.TrimSpace(smtpHost),
		smtpPort:      strings.TrimSpace(smtpPort),
		smtpUsername:  strings.TrimSpace(smtpUsername),
		smtpPassword:  smtpPassword,
		smtpFromEmail: strings.TrimSpace(smtpFromEmail),
		smtpFromName:  strings.TrimSpace(smtpFromName),
	}
	svc.sendEmailFn = svc.sendEmail
	return svc
}

func (s *NotificationService) IsEmailConfigured() bool {
	return s.smtpHost != "" && s.smtpPort != "" && s.smtpFromEmail != ""
}

func (s *NotificationService) GetRecentDeliveries(ctx context.Context, userID uuid.UUID, limit int) ([]models.NotificationDelivery, error) {
	if limit <= 0 {
		limit = 5
	}

	var deliveries []models.NotificationDelivery
	query := `
		SELECT id, user_id, notification_type, channel, status, subject, recipient, provider, error_message, metadata, created_at
		FROM notification_deliveries
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	if err := s.db.SelectContext(ctx, &deliveries, query, userID, limit); err != nil {
		return nil, err
	}
	return deliveries, nil
}

func (s *NotificationService) SendTestNotification(ctx context.Context, user *models.User, profile *models.UserProfile, goal *models.RaceGoal, notificationType string) (*models.NotificationDelivery, error) {
	subject, body, err := s.buildTestNotification(user, profile, goal, notificationType)
	if err != nil {
		return nil, err
	}

	return s.deliverEmail(ctx, user.ID, user.Email, notificationType, subject, body, map[string]any{
		"mode": "test",
	})
}

func (s *NotificationService) SendSyncFailureNotification(ctx context.Context, user *models.User, profile *models.UserProfile, syncError string) (*models.NotificationDelivery, error) {
	if profile == nil || !profile.NotifySyncFailures {
		return nil, nil
	}

	subject := "Korsana: your sync needs attention"
	body := fmt.Sprintf(
		"Hi %s,\n\nKorsana hit a sync problem while refreshing your training data.\n\nError: %s\n\nOpen Korsana to retry your sync and review your integrations:\n%s/settings\n",
		displayNameForUser(user, profile),
		syncError,
		s.safeFrontendURL(),
	)

	return s.deliverEmail(ctx, user.ID, user.Email, "sync_failure", subject, body, map[string]any{
		"mode":  "live",
		"error": syncError,
	})
}

func (s *NotificationService) buildTestNotification(user *models.User, profile *models.UserProfile, goal *models.RaceGoal, notificationType string) (string, string, error) {
	name := displayNameForUser(user, profile)
	switch notificationType {
	case "weekly_summary":
		subject := "Korsana weekly summary preview"
		body := fmt.Sprintf(
			"Hi %s,\n\nThis is a preview of your weekly summary email.\n\nYour notification preferences are active, and Korsana is ready to send a weekly recap once the scheduled digest job is enabled for this environment.\n\nOpen Korsana to review your current dashboard and training trendlines:\n%s/dashboard\n",
			name,
			s.safeFrontendURL(),
		)
		return subject, body, nil
	case "goal_reminder":
		raceLine := "your next race goal"
		if goal != nil {
			raceLine = fmt.Sprintf("%s on %s", goal.RaceName, goal.RaceDate.Format("January 2, 2006"))
		}
		subject := "Korsana goal reminder preview"
		body := fmt.Sprintf(
			"Hi %s,\n\nThis is a preview of your goal reminder notification.\n\nKorsana will use this channel to nudge you about important race milestones for %s.\n\nReview your goal progress in Korsana:\n%s/goals\n",
			name,
			raceLine,
			s.safeFrontendURL(),
		)
		return subject, body, nil
	case "sync_failure":
		subject := "Korsana sync alert preview"
		body := fmt.Sprintf(
			"Hi %s,\n\nThis is a preview of the sync alert email you will receive if a future sync fails.\n\nThese alerts are only sent when the Sync Errors preference is enabled.\n\nYou can review integrations here:\n%s/settings\n",
			name,
			s.safeFrontendURL(),
		)
		return subject, body, nil
	default:
		return "", "", ErrNotificationTypeUnsupported
	}
}

func (s *NotificationService) deliverEmail(ctx context.Context, userID uuid.UUID, recipient, notificationType, subject, body string, metadata map[string]any) (*models.NotificationDelivery, error) {
	if !s.IsEmailConfigured() {
		delivery, recordErr := s.recordDelivery(ctx, userID, recipient, notificationType, subject, "skipped", "email delivery is not configured", metadata)
		if recordErr != nil {
			return nil, recordErr
		}
		return delivery, ErrEmailNotConfigured
	}

	if err := s.sendEmailFn(recipient, subject, body); err != nil {
		delivery, recordErr := s.recordDelivery(ctx, userID, recipient, notificationType, subject, "failed", err.Error(), metadata)
		if recordErr != nil {
			return nil, recordErr
		}
		return delivery, err
	}

	return s.recordDelivery(ctx, userID, recipient, notificationType, subject, "sent", "", metadata)
}

func (s *NotificationService) recordDelivery(ctx context.Context, userID uuid.UUID, recipient, notificationType, subject, status, errorMessage string, metadata map[string]any) (*models.NotificationDelivery, error) {
	id := uuid.New()
	now := time.Now()

	if metadata == nil {
		metadata = map[string]any{}
	}

	metadataJSON := []byte("{}")
	if len(metadata) > 0 {
		encoded, err := json.Marshal(metadata)
		if err != nil {
			return nil, err
		}
		metadataJSON = encoded
	}

	var errorPtr *string
	if errorMessage != "" {
		errorPtr = &errorMessage
	}
	channel := "email"
	providerName := "smtp"

	query := `
		INSERT INTO notification_deliveries (
			id, user_id, notification_type, channel, status, subject, recipient, provider, error_message, metadata, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
	`

	if _, err := s.db.ExecContext(ctx, query, id, userID, notificationType, channel, status, subject, recipient, providerName, errorPtr, string(metadataJSON), now); err != nil {
		return nil, err
	}

	subjectCopy := subject
	recipientCopy := recipient
	providerCopy := providerName
	return &models.NotificationDelivery{
		ID:               id,
		UserID:           userID,
		NotificationType: notificationType,
		Channel:          channel,
		Status:           status,
		Subject:          &subjectCopy,
		Recipient:        &recipientCopy,
		Provider:         &providerCopy,
		ErrorMessage:     errorPtr,
		Metadata:         metadataJSON,
		CreatedAt:        now,
	}, nil
}

func (s *NotificationService) sendEmail(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	message := []byte(
		fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
			s.fromHeader(),
			to,
			subject,
			body,
		),
	)

	var auth smtp.Auth
	if s.smtpUsername != "" {
		auth = smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	}

	return smtp.SendMail(addr, auth, s.smtpFromEmail, []string{to}, message)
}

func (s *NotificationService) fromHeader() string {
	if s.smtpFromName == "" {
		return s.smtpFromEmail
	}
	return fmt.Sprintf("%s <%s>", s.smtpFromName, s.smtpFromEmail)
}

func (s *NotificationService) safeFrontendURL() string {
	if s.frontendURL == "" {
		return "http://localhost:5174"
	}
	return s.frontendURL
}

func displayNameForUser(user *models.User, profile *models.UserProfile) string {
	if profile != nil && profile.DisplayName != nil && strings.TrimSpace(*profile.DisplayName) != "" {
		return strings.TrimSpace(*profile.DisplayName)
	}
	if user != nil && user.Email != "" {
		parts := strings.Split(user.Email, "@")
		if len(parts) > 0 && parts[0] != "" {
			return parts[0]
		}
	}
	return "runner"
}
