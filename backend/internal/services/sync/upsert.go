package sync

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// upsertDecision is the outcome of ShouldInsertOrUpgrade.
type upsertDecision string

const (
	decisionInsert  upsertDecision = "insert"
	decisionUpgrade upsertDecision = "upgrade"
	decisionSkip    upsertDecision = "skip"
)

// shouldInsertOrUpgrade checks whether an incoming activity should be inserted
// fresh, used to upgrade an existing lower-priority row, or skipped entirely.
//
// Match criteria: same user, start time within 2 minutes, distance within 5%.
func shouldInsertOrUpgrade(ctx context.Context, db *sqlx.DB, userID uuid.UUID, incoming RawActivity) (upsertDecision, uuid.UUID, error) {
	query := `
		SELECT id, source FROM activities
		WHERE user_id = $1
		  AND ABS(EXTRACT(EPOCH FROM (start_time - $2))) < 120
		  AND ABS(distance_meters - $3) / NULLIF($3, 0) < 0.05
		LIMIT 1
	`
	var existing struct {
		ID     uuid.UUID `db:"id"`
		Source string    `db:"source"`
	}

	err := db.GetContext(ctx, &existing, query, userID, incoming.StartTime, incoming.Distance)
	if errors.Is(err, sql.ErrNoRows) {
		return decisionInsert, uuid.Nil, nil
	}
	if err != nil {
		return "", uuid.Nil, fmt.Errorf("shouldInsertOrUpgrade query: %w", err)
	}

	if HigherPriority(incoming.Source, existing.Source) {
		return decisionUpgrade, existing.ID, nil
	}
	return decisionSkip, existing.ID, nil
}

// UpsertActivity normalizes a RawActivity and applies the priority-aware
// insert/upgrade/skip logic. On upgrade the existing row's ID is preserved
// so calendar entries and AI coach history remain intact.
func UpsertActivity(ctx context.Context, db *sqlx.DB, userID uuid.UUID, raw RawActivity) error {
	decision, existingID, err := shouldInsertOrUpgrade(ctx, db, userID, raw)
	if err != nil {
		return err
	}

	switch decision {
	case decisionInsert:
		return insertActivity(ctx, db, userID, raw)
	case decisionUpgrade:
		return upgradeActivity(ctx, db, existingID, raw)
	case decisionSkip:
		return nil
	default:
		return nil
	}
}

func insertActivity(ctx context.Context, db *sqlx.DB, userID uuid.UUID, raw RawActivity) error {
	query := `
		INSERT INTO activities (
			id, user_id, source, source_activity_id, activity_type, name,
			distance_meters, duration_seconds, start_time, average_pace_seconds_per_km,
			average_heart_rate, max_heart_rate, elevation_gain_meters,
			average_cadence, suffer_score, synced_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10,
			$11, $12, $13,
			$14, $15, $16
		)
		ON CONFLICT (user_id, source, source_activity_id) DO NOTHING
	`
	_, err := db.ExecContext(ctx, query,
		uuid.New(), userID, raw.Source, raw.SourceID, raw.SportType, raw.Name,
		raw.Distance, raw.Duration, raw.StartTime, raw.AvgPace,
		raw.AvgHR, raw.MaxHR, raw.ElevGain,
		raw.AvgCadence, raw.SufferScore, time.Now(),
	)
	return err
}

func upgradeActivity(ctx context.Context, db *sqlx.DB, id uuid.UUID, raw RawActivity) error {
	// Preserve the existing row ID so downstream references stay intact.
	query := `
		UPDATE activities SET
			source                    = $1,
			source_activity_id        = $2,
			activity_type             = $3,
			name                      = $4,
			distance_meters           = $5,
			duration_seconds          = $6,
			average_pace_seconds_per_km = $7,
			average_heart_rate        = $8,
			max_heart_rate            = $9,
			elevation_gain_meters     = $10,
			average_cadence           = $11,
			suffer_score              = $12,
			synced_at                 = $13
		WHERE id = $14
	`
	_, err := db.ExecContext(ctx, query,
		raw.Source, raw.SourceID, raw.SportType, raw.Name,
		raw.Distance, raw.Duration, raw.AvgPace,
		raw.AvgHR, raw.MaxHR, raw.ElevGain,
		raw.AvgCadence, raw.SufferScore, time.Now(),
		id,
	)
	return err
}
