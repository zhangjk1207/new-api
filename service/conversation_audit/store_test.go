package conversationaudit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuditSQLiteStoreMigratesAndPersists(t *testing.T) {
	db, err := openAuditDatabase("sqlite://file:" + t.Name() + "?mode=memory&cache=shared")
	require.NoError(t, err)
	require.NoError(t, migrateAuditDatabase(db))

	want := turnRow{
		EventTime:      time.Date(2026, 7, 27, 12, 0, 0, 0, time.UTC),
		RequestID:      "request-1",
		ConversationID: "conversation-1",
		Username:       "tester",
		Completed:      1,
	}
	require.NoError(t, db.Create(&want).Error)

	var got turnRow
	require.NoError(t, db.Where("request_id = ?", want.RequestID).First(&got).Error)
	assert.Equal(t, want.ConversationID, got.ConversationID)
	assert.Equal(t, want.Completed, got.Completed)
}

func TestOpenAuditDatabaseRejectsClickHouse(t *testing.T) {
	_, err := openAuditDatabase("clickhouse://default:password@127.0.0.1:9000/audit")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "no longer supported")
}
