package services

import (
	"errors"
	"testing"

	"github.com/korsana/backend/internal/models"
)

func TestNormalizeCoachMode(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{name: "default empty mode", input: "", want: coachModeCopilot},
		{name: "copilot mode", input: "copilot", want: coachModeCopilot},
		{name: "guide mode", input: "guide", want: coachModeGuide},
		{name: "mixed case guide", input: " Guide ", want: coachModeGuide},
		{name: "invalid mode", input: "autopilot", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeCoachMode(tt.input)
			if tt.wantErr {
				if !errors.Is(err, ErrInvalidCoachMode) {
					t.Fatalf("expected ErrInvalidCoachMode, got %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("expected %q, got %q", tt.want, got)
			}
		})
	}
}

func TestMergeFlaggedConcernsDeduplicatesAndPreservesRecency(t *testing.T) {
	existing := []flaggedConcern{
		{Text: "Knee pain after tempo run", Date: "Apr 17"},
		{Text: "Fatigue building after long run", Date: "Apr 16"},
		{Text: "knee   pain after  tempo run", Date: "Apr 15"},
		{Text: "Watch the mileage jump", Date: "Apr 14"},
	}
	incoming := flaggedConcern{Text: "  Knee pain after tempo run  ", Date: "Apr 18"}

	merged := mergeFlaggedConcerns(existing, incoming, 5)

	if len(merged) != 3 {
		t.Fatalf("expected 3 unique concerns, got %d", len(merged))
	}
	if merged[0].Text != incoming.Text {
		t.Fatalf("expected newest concern first, got %q", merged[0].Text)
	}
	if merged[1].Text != "Fatigue building after long run" {
		t.Fatalf("expected second concern to preserve recency order, got %q", merged[1].Text)
	}
	if merged[2].Text != "Watch the mileage jump" {
		t.Fatalf("expected third concern to preserve remaining history, got %q", merged[2].Text)
	}
}

func TestMergeFlaggedConcernsAppliesLimit(t *testing.T) {
	existing := []flaggedConcern{
		{Text: "Concern 1", Date: "Apr 17"},
		{Text: "Concern 2", Date: "Apr 16"},
		{Text: "Concern 3", Date: "Apr 15"},
	}
	incoming := flaggedConcern{Text: "Concern 4", Date: "Apr 18"}

	merged := mergeFlaggedConcerns(existing, incoming, 2)

	if len(merged) != 2 {
		t.Fatalf("expected 2 concerns after limit applied, got %d", len(merged))
	}
	if merged[0].Text != "Concern 4" || merged[1].Text != "Concern 1" {
		t.Fatalf("unexpected merge order: %#v", merged)
	}
}

func TestLimitContextItems(t *testing.T) {
	activities := []models.Activity{
		{Name: "Newest"},
		{Name: "Second"},
		{Name: "Third"},
	}

	limited := limitContextItems(activities, 2)
	if len(limited) != 2 {
		t.Fatalf("expected 2 activities after capping, got %d", len(limited))
	}
	if limited[0].Name != "Newest" || limited[1].Name != "Second" {
		t.Fatalf("expected capping to preserve recency order, got %#v", limited)
	}

	if got := limitContextItems(activities, 0); got != nil {
		t.Fatalf("expected zero limit to return nil, got %#v", got)
	}
}

func TestExtractArtifactAcceptsValidRaceStrategy(t *testing.T) {
	response := "Stay calm early.\n```artifact\n{\"type\":\"race_strategy\",\"headline\":\"Run the first 5K easy.\",\"target_pace\":\"9:10/mi\",\"phases\":[{\"phase\":\"Start\",\"guidance\":\"Stay relaxed.\"}],\"key_reminders\":[\"Fuel early\"]}\n```"

	clean, artifact := extractArtifact(response)
	if clean != "Stay calm early." {
		t.Fatalf("expected cleaned response, got %q", clean)
	}
	if artifact == nil {
		t.Fatal("expected valid artifact to be returned")
	}
	if artifact.Type != "race_strategy" {
		t.Fatalf("expected race_strategy artifact, got %q", artifact.Type)
	}
}

func TestExtractArtifactRejectsInvalidRaceStrategyShape(t *testing.T) {
	response := "Plan below.\n```artifact\n{\"type\":\"race_strategy\",\"headline\":\"Race smart.\",\"target_pace\":\"9:10/mi\",\"phases\":[],\"key_reminders\":[]}\n```"

	clean, artifact := extractArtifact(response)
	if clean != "Plan below." {
		t.Fatalf("expected cleaned response, got %q", clean)
	}
	if artifact != nil {
		t.Fatalf("expected invalid artifact to be dropped, got %#v", artifact)
	}
}
