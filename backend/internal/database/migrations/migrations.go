// Package migrations embeds the SQL migration files so the migrate runner
// (cmd/migrate) can apply them without needing the SQL files to be present
// on disk at runtime. Files in manual/ are intentionally excluded — see
// manual/README.md.
package migrations

import "embed"

// FS holds every *.up.sql file in this directory. Add new migrations as
// NNN_description.up.sql and they are picked up automatically.
//
//go:embed *.up.sql
var FS embed.FS
