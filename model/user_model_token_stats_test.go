package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetUserModelTokenStatsGroupsHourlyUsageByUserAndModel(t *testing.T) {
	truncateTables(t)

	for _, row := range []QuotaData{
		{UserID: 1, Username: "alice", ModelName: "gpt-a", CreatedAt: 3600, TokenUsed: 40, Count: 2},
		{UserID: 1, Username: "alice", ModelName: "gpt-a", CreatedAt: 3600, TokenUsed: 60, Count: 3},
		{UserID: 1, Username: "alice", ModelName: "gpt-b", CreatedAt: 3600, TokenUsed: 25, Count: 1},
		{UserID: 2, Username: "bob", ModelName: "gpt-a", CreatedAt: 7200, TokenUsed: 90, Count: 4},
		{UserID: 2, Username: "bob", ModelName: "gpt-a", CreatedAt: 10800, TokenUsed: 70, Count: 2},
	} {
		require.NoError(t, DB.Create(&row).Error)
	}

	stats, err := GetUserModelTokenStats(3600, 7200)
	require.NoError(t, err)
	require.Equal(t, []*UserModelTokenStat{
		{UserID: 1, Username: "alice", ModelName: "gpt-a", CreatedAt: 3600, TokenUsed: 100, Count: 5},
		{UserID: 1, Username: "alice", ModelName: "gpt-b", CreatedAt: 3600, TokenUsed: 25, Count: 1},
		{UserID: 2, Username: "bob", ModelName: "gpt-a", CreatedAt: 7200, TokenUsed: 90, Count: 4},
	}, stats)
}
