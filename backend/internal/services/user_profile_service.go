package services

import (
	"context"
	"database/sql"
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

type UserProfileService struct {
	db *database.DB
}

func NewUserProfileService(db *database.DB) *UserProfileService {
	return &UserProfileService{db: db}
}

// GetOrCreateProfile returns the user's profile, creating a default one if it doesn't exist.
func (s *UserProfileService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID) (*models.UserProfile, error) {
	var profile models.UserProfile
	query := `SELECT * FROM user_profiles WHERE user_id = $1`
	err := s.db.GetContext(ctx, &profile, query, userID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			profile = models.UserProfile{
				ID:        uuid.New(),
				UserID:    userID,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			insertQuery := `
				INSERT INTO user_profiles (id, user_id, created_at, updated_at)
				VALUES (:id, :user_id, :created_at, :updated_at)
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
		INSERT INTO user_profiles (id, user_id, display_name, profile_picture_url, max_heart_rate, resting_heart_rate, weekly_distance_goal_meters, created_at, updated_at)
		VALUES (:id, :user_id, :display_name, :profile_picture_url, :max_heart_rate, :resting_heart_rate, :weekly_distance_goal_meters, :created_at, :updated_at)
		ON CONFLICT(user_id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			profile_picture_url = EXCLUDED.profile_picture_url,
			max_heart_rate = EXCLUDED.max_heart_rate,
			resting_heart_rate = EXCLUDED.resting_heart_rate,
			weekly_distance_goal_meters = EXCLUDED.weekly_distance_goal_meters,
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

// SaveAvatar handles the file save for a profile picture in the uploads directory.
func (s *UserProfileService) SaveAvatar(userID uuid.UUID, file *multipart.FileHeader) (string, error) {
	err := os.MkdirAll("uploads/avatars", 0755)
	if err != nil {
		return "", err
	}

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	filename := userID.String() + ext
	path := filepath.Join("uploads/avatars", filename)

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return "", err
	}

	return "/uploads/avatars/" + filename, nil
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
func (s *UserProfileService) DetectPRsFromStrava(ctx context.Context, userID uuid.UUID) (int, error) {
	windows := []struct {
		Label   string
		MinDist float64
		MaxDist float64
		DistInt int
	}{
		{"5K", 4800, 5200, 5000},
		{"10K", 9800, 10200, 10000},
		{"Half Marathon", 21000, 21300, 21097},
		{"Marathon", 42000, 42400, 42195},
	}

	detectedCount := 0
	for _, w := range windows {
		var bestAct models.Activity
		query := `
			SELECT * FROM activities 
			WHERE user_id = $1 AND activity_type = 'run' 
			AND distance_meters >= $2 AND distance_meters <= $3
			ORDER BY duration_seconds ASC LIMIT 1
		`
		err := s.db.GetContext(ctx, &bestAct, query, userID, w.MinDist, w.MaxDist)
		if err != nil {
			continue // none found or error
		}

		var currentPR models.PersonalRecord
		err = s.db.GetContext(ctx, &currentPR, "SELECT * FROM personal_records WHERE user_id = $1 AND label = $2", userID, w.Label)

		isNewBest := true
		if err == nil {
			if bestAct.DurationSeconds >= currentPR.TimeSeconds {
				isNewBest = false // existing is faster or tied
			}
		}

		if isNewBest {
			recAt := bestAct.StartTime
			pr := models.PersonalRecord{
				UserID:         userID,
				Label:          w.Label,
				DistanceMeters: &w.DistInt,
				TimeSeconds:    bestAct.DurationSeconds,
				Source:         "strava",
				ActivityID:     &bestAct.ID,
				RecordedAt:     &recAt,
			}
			if err := s.UpsertPersonalRecord(ctx, &pr); err == nil {
				detectedCount++
			}
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
