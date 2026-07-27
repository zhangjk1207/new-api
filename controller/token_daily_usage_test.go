package controller

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseTokenUsageDateRange(t *testing.T) {
	now := time.Date(2026, 7, 27, 20, 30, 0, 0, time.UTC)

	t.Run("defaults to current Beijing date", func(t *testing.T) {
		start, end, err := parseTokenUsageDateRange("", "", now)
		require.NoError(t, err)
		assert.Equal(t, "2026-07-28", start.Format(time.DateOnly))
		assert.Equal(t, start, end)
	})

	t.Run("accepts inclusive range", func(t *testing.T) {
		start, end, err := parseTokenUsageDateRange("2026-07-01", "2026-07-27", now)
		require.NoError(t, err)
		assert.Equal(t, "2026-07-01", start.Format(time.DateOnly))
		assert.Equal(t, "2026-07-27", end.Format(time.DateOnly))
	})

	t.Run("requires both dates", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2026-07-01", "", now)
		assert.EqualError(t, err, "start_date and end_date must be provided together")
	})

	t.Run("rejects reversed range", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2026-07-28", "2026-07-27", now)
		assert.EqualError(t, err, "end_date must not be earlier than start_date")
	})

	t.Run("rejects more than 366 days", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2025-01-01", "2026-01-02", now)
		assert.EqualError(t, err, "date range must not exceed 366 days")
	})
}
