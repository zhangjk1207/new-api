package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetUserModelTokenStatsAggregatesConsumeLogsWithDimensionFilters(t *testing.T) {
	truncateTables(t)

	for _, row := range []Log{
		{UserId: 1, Username: "alice", TokenId: 11, TokenName: "team-a", ModelName: "gpt-a", CreatedAt: 3610, Type: LogTypeConsume, PromptTokens: 10, CompletionTokens: 20},
		{UserId: 1, Username: "alice", TokenId: 11, TokenName: "team-a", ModelName: "gpt-a", CreatedAt: 3690, Type: LogTypeConsume, PromptTokens: 15, CompletionTokens: 25},
		{UserId: 1, Username: "alice", TokenId: 12, TokenName: "team-b", ModelName: "gpt-a", CreatedAt: 3700, Type: LogTypeConsume, PromptTokens: 100, CompletionTokens: 200},
		{UserId: 2, Username: "bob", TokenId: 13, TokenName: "team-a", ModelName: "gpt-a", CreatedAt: 7200, Type: LogTypeConsume, PromptTokens: 50, CompletionTokens: 60},
		{UserId: 1, Username: "alice", TokenId: 11, TokenName: "team-a", ModelName: "gpt-a", CreatedAt: 3750, Type: LogTypeError, PromptTokens: 999, CompletionTokens: 999},
	} {
		require.NoError(t, LOG_DB.Create(&row).Error)
	}

	stats, err := GetUserModelTokenStats(UserModelTokenStatsFilter{
		StartTime: 3600,
		EndTime:   7200,
		Username:  "alice",
		TokenName: "team-a",
		ModelName: "gpt-a",
	})
	require.NoError(t, err)
	require.Equal(t, []*UserModelTokenStat{
		{UserID: 1, Username: "alice", TokenID: 11, TokenName: "team-a", ModelName: "gpt-a", CreatedAt: 3600, PromptTokens: 25, CompletionTokens: 45, TokenUsed: 70, Count: 2},
	}, stats)
}
