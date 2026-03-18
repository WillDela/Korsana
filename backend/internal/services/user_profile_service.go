package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

type UserProfileService struct {
	db                     *database.DB
	supabaseURL            string
	supabaseServiceRoleKey string
}

func NewUserProfileService(db *database.DB, supabaseURL, supabaseServiceRoleKey string) *UserProfileService {
	return &UserProfileService{
		db:                     db,
		supabaseURL:            supabaseURL,
		supabaseServiceRoleKey: supabaseServiceRoleKey,
	}
}

// GetOrCreateProfile returns the user's profile, creating a default one if it doesn't exist.
func (s *UserProfileService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	var profile models.UserProfile
	query := `SELECT * FROM user_profiles WHERE user_id = $1`
	err := s.db.GetContext(ctx, &profile, query, userID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			profile = models.UserProfile{
				ID:                  uuid.New(),
				UserID:              userID,
				UnitsPreference:     "metric",
				NotifyWeeklySummary: true,
				NotifyGoalReminders: true,
				NotifySyncFailures:  true,
				CreatedAt:           time.Now(),
				UpdatedAt:           time.Now(),
			}
			insertQuery := `
				INSERT INTO user_profiles (id, user_id, units_preference, notify_weekly_summary, notify_goal_reminders, notify_sync_failures, created_at, updated_at)
				VALUES (:id, :user_id, :units_preference, :notify_weekly_summary, :notify_goal_reminders, :notify_sync_failures, :created_at, :updated_at)
			`
			if _, e := s.db.NamedExecContext(ctx, insertQuery, profile); e != nil {
				return nil, e
			}
			return &profile, nil
		}
		return nil, err
	}
	return &profile, nil
}

// UpdateProfile updates the mutable portions of a user profile.
func (s *UserProfileService) UpdateProfile(ctx context.Context, profile *models.UserProfile) (*models.UserProfile, error) {
	profile.UpdatedAt = time.Now()
	query := `
		INSERT INTO user_profiles (id, user_id, display_name, profile_picture_url, max_heart_rate, resting_heart_rate, weekly_distance_goal_meters, units_preference, notify_weekly_summary, notify_goal_reminders, notify_sync_failures, created_at, updated_at)
		VALUES (:id, :user_id, :display_name, :profile_picture_url, :max_heart_rate, :resting_heart_rate, :weekly_distance_goal_meters, :units_preference, :notify_weekly_summary, :notify_goal_reminders, :notify_sync_failures, :created_at, :updated_at)
		ON CONFLICT(user_id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			profile_picture_url = EXCLUDED.profile_picture_url,
			max_heart_rate = EXCLUDED.max_heart_rate,
			resting_heart_rate = EXCLUDED.resting_heart_rate,
			weekly_distance_goal_meters = EXCLUDED.weekly_distance_goal_meters,
			units_preference = EXCLUDED.units_preference,
			notify_weekly_summary = EXCLUDED.notify_weekly_summary,
			notify_goal_reminders = EXCLUDED.notify_goal_reminders,
			notify_sync_failures = EXCLUDED.notify_sync_failures,
			updated_at = EXCLUDED.updated_at
		RETURNING *
	`
	rows, err := s.db.NamedQueryContext(ctx, query, profile)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if rows.Next() {
		if err := rows.StructScan(profile); err != nil {
			return nil, err
		}
	}
	return profile, nil
}

// SaveAvatar uploads a profile picture to Supabase Storage and returns the public URL.
func (s *UserProfileService) SaveAvatar(ctx context.Context, userID uuid.UUID, file *multipart.FileHeader) (string, error) {
	const maxSize int64 = 5 * 1024 * 1024
	if file.Size > maxSize {
		return "", errors.New("avatar file exceeds 5 MB limit")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExt := map[string]bool{
		".jpg": true, ".jpeg": true,
		".png": true, ".webp": true, ".gif": true,
	}
	if !allowedExt[ext] {
		return "", errors.New("avatar must be JPG, PNG, WebP, or GIF")
	}

	src, err := file.Open()
	if err != nil {
		return "", errors.New("failed to open uploaded file")
	}
	defer src.Close()

	buf := make([]byte, 512)
	if _, err := io.ReadFull(src, buf); err != nil && err != io.ErrUnexpectedEOF {
		return "", errors.New("failed to read file for type check")
	}
	mimeType := http.DetectContentType(buf)
	allowedMime := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}
	if !allowedMime[mimeType] {
		return "", errors.New("avatar must be a valid image file")
	}

	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return "", errors.New("failed to reset file reader")
	}

	objectPath := userID.String() + ext
	uploadURL := fmt.Sprintf("%s/storage/v1/object/avatars/%s", s.supabaseURL, objectPath)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, src)
	if err != nil {
		return "", fmt.Errorf("create upload request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.supabaseServiceRoleKey)
	req.Header.Set("Content-Type", mimeType)
	req.Header.Set("x-upsert", "true")
	req.ContentLength = file.Size

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload to storage: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return "", fmt.Errorf("storage upload failed (%d): %v", resp.StatusCode, errBody)
	}

	publicURL := fmt.Sprintf("%s/storage/v1/object/public/avatars/%s", s.supabaseURL, objectPath)
	return publicURL, nil
}

// GetPersonalRecords gets all PRs ordered by distance.
func (s *UserProfileService) GetPersonalRecords(ctx context.Context, userID uuid.UUID) ([]models.PersonalRecord, error) {
	var prs []models.PersonalRecord
	query := `SELECT * FROM personal_records WHERE user_id = $1 ORDER BY distance_meters NULLS LAST`
	err := s.db.SelectContext(ctx, &prs, query, userID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	return prs, nil
}

// UpsertPersonalRecord creates or updates a PR by label.
func (s *UserProfileService) UpsertPersonalRecord(ctx context.Context, pr *models.PersonalRecord) error {
	pr.UpdatedAt = time.Now()
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
		pr.CreatedAt = time.Now()
	}

	query := `
		INSERT INTO personal_records (id, user_id, label, distance_meters, time_seconds, source, activity_id, recorded_at, notes, created_at, updated_at)
		VALUES (:id, :user_id, :label, :distance_meters, :time_seconds, :source, :activity_id, :recorded_at, :notes, :created_at, :updated_at)
		ON CONFLICT(user_id, label) DO UPDATE SET
			distance_meters = EXCLUDED.distance_meters,
			time_seconds = EXCLUDED.time_seconds,
			source = EXCLUDED.source,
			activity_id = EXCLUDED.activity_id,
			recorded_at = EXCLUDED.recorded_at,
			notes = EXCLUDED.notes,
			updated_at = EXCLUDED.updated_at
	`
	_, err := s.db.NamedExecContext(ctx, query, pr)
	return err
}

// DeletePersonalRecord removes a PR.
func (s *UserProfileService) DeletePersonalRecord(ctx context.Context, userID uuid.UUID, label string) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM personal_records WHERE user_id = $1 AND label = $2", userID, label)
	return err
}

// DetectPRsFromStrava scans activities for standard distances and upserts new PRs.
//
// Two strategies per distance:
//  1. Direct: activities whose total distance is within ±12% of the target — use total duration.
//  2. Split:  activities longer than 1.2× the target that have a recorded average pace —
//     estimate the split time as avg_pace × target_km. This catches 10K splits inside a
//     long run, half-marathon pace inside a marathon, etc.
//
// The faster time from either strategy wins.
func (s *UserProfileService) DetectPRsFromStrava(ctx context.Context, userID uuid.UUID) (int, error) {
	targets := []struct {
		Label   string
		Dist    float64 // canonical distance in meters
		DistInt int
	}{
		{"5K", 5000, 5000},
		{"10K", 10000, 10000},
		{"Half Marathon", 21097, 21097},
		{"Marathon", 42195, 42195},
	}

	runTypes := []string{"run", "walking", "hiking"}

	detectedCount := 0
	for _, t := range targets {
		minDirect := t.Dist * 0.88
		maxDirect := t.Dist * 1.12
		minSplit := t.Dist * 1.20

		bestTime := 0
		var bestActID uuid.UUID
		var bestStart time.Time

		// Strategy 1: activities whose total distance matches the target distance (±12%).
		// Widened from the old ±500m/fixed window to handle GPS over-recording in races.
		var directActs []models.Activity
		directQ := `
			SELECT * FROM activities
			WHERE user_id = $1
			  AND activity_type = ANY($2)
			  AND distance_meters >= $3
			  AND distance_meters <= $4
			ORDER BY duration_seconds ASC
		`
		_ = s.db.SelectContext(ctx, &directActs, directQ, userID, runTypes, minDirect, maxDirect)
		for _, a := range directActs {
			if a.DurationSeconds > 0 && (bestTime == 0 || a.DurationSeconds < bestTime) {
				bestTime = a.DurationSeconds
				bestActID = a.ID
				bestStart = a.StartTime
			}
		}

		// Strategy 2: longer activities — estimate split from average pace.
		// average_pace_seconds_per_km × (target_dist / 1000) = estimated split seconds.
		var splitActs []models.Activity
		splitQ := `
			SELECT * FROM activities
			WHERE user_id = $1
			  AND activity_type = ANY($2)
			  AND distance_meters > $3
			  AND average_pace_seconds_per_km > 0
			ORDER BY average_pace_seconds_per_km ASC
		`
		_ = s.db.SelectContext(ctx, &splitActs, splitQ, userID, runTypes, minSplit)
		for _, a := range splitActs {
			estimated := int(a.AveragePaceSecondsPerKm * (t.Dist / 1000.0))
			if estimated > 0 && (bestTime == 0 || estimated < bestTime) {
				bestTime = estimated
				bestActID = a.ID
				bestStart = a.StartTime
			}
		}

		if bestTime == 0 {
			continue
		}

		// Only upsert if it beats the stored PR (or none exists yet).
		var current models.PersonalRecord
		err := s.db.GetContext(ctx, &current, "SELECT * FROM personal_records WHERE user_id = $1 AND label = $2", userID, t.Label)
		if err == nil && current.TimeSeconds <= bestTime {
			continue // stored PR is faster or tied
		}

		recAt := bestStart
		distInt := t.DistInt
		actID := bestActID
		pr := models.PersonalRecord{
			UserID:         userID,
			Label:          t.Label,
			DistanceMeters: &distInt,
			TimeSeconds:    bestTime,
			Source:         "strava",
			ActivityID:     &actID,
			RecordedAt:     &recAt,
		}
		if err := s.UpsertPersonalRecord(ctx, &pr); err == nil {
			detectedCount++
		}
	}
	return detectedCount, nil
}

// GetCurrentWeekSummary returns the current week's summary, or nil if none exists yet.
func (s *UserProfileService) GetCurrentWeekSummary(ctx context.Context, userID uuid.UUID) (*models.WeeklySummary, error) {
	var summary models.WeeklySummary
	query := `SELECT * FROM weekly_summaries WHERE user_id = $1 AND week_start = date_trunc('week', NOW())::date LIMIT 1`
	err := s.db.GetContext(ctx, &summary, query, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &summary, nil
}

// GetTrainingZones fetches training zones, auto-calculating if none exist yet.
func (s *UserProfileService) GetTrainingZones(ctx context.Context, userID uuid.UUID, zoneType string) ([]models.TrainingZone, error) {
	var zones []models.TrainingZone
	query := `SELECT * FROM training_zones WHERE user_id = $1 AND zone_type = $2 ORDER BY zone_number ASC`
	err := s.db.SelectContext(ctx, &zones, query, userID, zoneType)
	if err != nil {
		return nil, err
	}

	// Auto-calc if missing
	if len(zones) == 0 {
		profile, err := s.GetOrCreateProfile(ctx, userID)
		if err != nil {
			return nil, err
		}

		if zoneType == "hr" {
			max := 190
			rest := 60
			if profile.MaxHeartRate != nil {
				max = *profile.MaxHeartRate
			}
			if profile.RestingHeartRate != nil {
				rest = *profile.RestingHeartRate
			}
			calcZones := s.CalculateHRZones(max, rest)
			for i, cz := range calcZones {
				z := models.TrainingZone{
					ID:               uuid.New(),
					UserID:           userID,
					ZoneType:         "hr",
					ZoneNumber:       i + 1,
					IsAutoCalculated: true,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				}

				lbl := cz.Label
				desc := cz.Description
				minVal := cz.Min
				z.Label = &lbl
				z.Description = &desc
				z.MinValue = &minVal
				if cz.Max != nil {
					maxVal := *cz.Max
					z.MaxValue = &maxVal
				}

				if err := s.UpsertTrainingZone(ctx, &z); err == nil {
					zones = append(zones, z)
				}
			}
		} else if zoneType == "pace" {
			// Basic threshold pace fallback is 5:00/km = 300s
			calcZones := s.CalculatePaceZones(300)
			for i, cz := range calcZones {
				z := models.TrainingZone{
					ID:               uuid.New(),
					UserID:           userID,
					ZoneType:         "pace",
					ZoneNumber:       i + 1,
					IsAutoCalculated: true,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				}

				lbl := cz.Label
				desc := cz.Description
				minVal := cz.Min
				z.Label = &lbl
				z.Description = &desc
				z.MinValue = &minVal
				if cz.Max != nil {
					maxVal := *cz.Max
					z.MaxValue = &maxVal
				}

				if err := s.UpsertTrainingZone(ctx, &z); err == nil {
					zones = append(zones, z)
				}
			}
		}
	}
	return zones, nil
}

// UpsertTrainingZone creates or updates a single zone.
func (s *UserProfileService) UpsertTrainingZone(ctx context.Context, z *models.TrainingZone) error {
	z.UpdatedAt = time.Now()
	query := `
		INSERT INTO training_zones (id, user_id, zone_type, zone_number, label, description, min_value, max_value, is_auto_calculated, created_at, updated_at)
		VALUES (:id, :user_id, :zone_type, :zone_number, :label, :description, :min_value, :max_value, :is_auto_calculated, :created_at, :updated_at)
		ON CONFLICT(user_id, zone_type, zone_number) DO UPDATE SET
			label = EXCLUDED.label,
			description = EXCLUDED.description,
			min_value = EXCLUDED.min_value,
			max_value = EXCLUDED.max_value,
			is_auto_calculated = EXCLUDED.is_auto_calculated,
			updated_at = EXCLUDED.updated_at
	`
	_, err := s.db.NamedExecContext(ctx, query, z)
	return err
}

// SaveManualZones replaces existing zones for a type.
func (s *UserProfileService) SaveManualZones(ctx context.Context, userID uuid.UUID, zoneType string, zones []models.TrainingZone) error {
	for i, z := range zones {
		z.UserID = userID
		z.ZoneType = zoneType
		z.ZoneNumber = i + 1
		z.IsAutoCalculated = false
		if z.ID == uuid.Nil {
			z.ID = uuid.New()
			z.CreatedAt = time.Now()
		}
		if err := s.UpsertTrainingZone(ctx, &z); err != nil {
			return err
		}
	}
	return nil
}

type CalculatedZone struct {
	Label       string
	Description string
	Min         int
	Max         *int
}

// CalculateHRZones calculates Karvonen HR zones using max and resting HR.
func (s *UserProfileService) CalculateHRZones(maxHR, restingHR int) []CalculatedZone {
	hrr := float64(maxHR - restingHR)
	rest := float64(restingHR)

	z1Max := int(rest+hrr*0.60) - 1
	z2Max := int(rest+hrr*0.70) - 1
	z3Max := int(rest+hrr*0.80) - 1
	z4Max := int(rest+hrr*0.90) - 1
	z5Max := maxHR

	return []CalculatedZone{
		{"Recovery", "Easy effort, promotes recovery", int(rest + hrr*0.50), &z1Max},
		{"Aerobic", "Endurance building, conversational pace", z1Max + 1, &z2Max},
		{"Tempo", "Moderately hard, comfortably hard", z2Max + 1, &z3Max},
		{"Threshold", "Hard effort, barely sustainable for an hour", z3Max + 1, &z4Max},
		{"Anaerobic", "All out, very hard", z4Max + 1, &z5Max},
	}
}

// CalculatePaceZones maps threshold %s for Pace Zones. Minimum = Faster, Maximum = Slower.
func (s *UserProfileService) CalculatePaceZones(thresholdPace int) []CalculatedZone {
	th := float64(thresholdPace)

	// Since pace is time per distance, a larger percentage (e.g. 129%) means SLOWER pace.
	// Z1: >129%
	z1Min := int(th * 1.29)
	// Z2: 114-129%
	z2Min := int(th * 1.14)
	z2Max := z1Min - 1
	// Z3: 106-114%
	z3Min := int(th * 1.06)
	z3Max := z2Min - 1
	// Z4: 99-106%
	z4Min := int(th * 0.99)
	z4Max := z3Min - 1
	// Z5: <99%
	z5Min := 0
	z5Max := z4Min - 1

	return []CalculatedZone{
		{"Recovery Pace", "Very relaxed running", z1Min, nil},
		{"Aerobic Pace", "Steady endurance pace", z2Min, &z2Max},
		{"Tempo Pace", "Comfortably hard running", z3Min, &z3Max},
		{"Threshold Pace", "Race pace effort", z4Min, &z4Max},
		{"Anaerobic Pace", "Fast, short interval pace", z5Min, &z5Max},
	}
}
