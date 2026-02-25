package sync

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/korsana/backend/internal/models"
)

// UpgradeHistoricalActivities fetches all activities from a newly connected
// higher-priority source and runs UpsertActivity for each one. Existing rows
// that match get upgraded in place — their IDs don't change so calendar
// entries and AI coach history remain intact.
//
// This should always be called in a goroutine so the OAuth callback is not
// blocked waiting for a potentially long sync.
//
//	go sync.UpgradeHistoricalActivities(ctx, db, userID, provider, integration)
func UpgradeHistoricalActivities(
	ctx context.Context,
	db *sqlx.DB,
	userID uuid.UUID,
	provider DataProvider,
	integration *models.ConnectedIntegration,
) error {
	if err := provider.RefreshTokenIfNeeded(integration); err != nil {
		return err
	}

	activities, err := provider.FetchAllActivities(integration)
	if err != nil {
		return err
	}

	for _, a := range activities {
		if err := UpsertActivity(ctx, db, userID, a); err != nil {
			// Log and continue — a partial re-sync is better than none.
			log.Printf("sync: failed to upsert activity %s from %s: %v", a.SourceID, a.Source, err)
		}
	}

	return nil
}
