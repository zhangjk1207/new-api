package conversationaudit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNormalizeListFilterBoundsPaginationAndDefaultWindow(t *testing.T) {
	now := time.Date(2026, 7, 15, 16, 0, 0, 0, time.UTC)
	filter := normalizeListFilter(ListFilter{Page: -1, PageSize: 999}, now)

	assert.Equal(t, 1, filter.Page)
	assert.Equal(t, 100, filter.PageSize)
	assert.Equal(t, now.Add(-24*time.Hour), filter.StartAt)
	assert.Equal(t, now, filter.EndAt)
}
