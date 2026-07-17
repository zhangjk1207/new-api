package conversationaudit

import "testing"

import (
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuditDatabaseNameFromDSN(t *testing.T) {
	name, err := auditDatabaseNameFromDSN("clickhouse://default:password@127.0.0.1:9000/new_api_conversation_audit")

	require.NoError(t, err)
	assert.Equal(t, "new_api_conversation_audit", name)
}

func TestAuditDatabaseNameFromDSNRejectsUnsafeName(t *testing.T) {
	_, err := auditDatabaseNameFromDSN("clickhouse://default:password@127.0.0.1:9000/audit;DROP%20DATABASE%20default")

	require.Error(t, err)
}
