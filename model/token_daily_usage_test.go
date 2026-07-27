package model

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestGetTokenDailyUsageReturnsEveryBeijingDate(t *testing.T) {
	originalLogDB := LOG_DB
	t.Cleanup(func() { LOG_DB = originalLogDB })

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&Log{}))
	LOG_DB = db

	location := time.FixedZone("Asia/Shanghai", 8*60*60)
	startDate := time.Date(2026, 7, 25, 0, 0, 0, 0, location)
	endDate := time.Date(2026, 7, 27, 0, 0, 0, 0, location)
	logs := []Log{
		{TokenId: 7, Type: LogTypeConsume, CreatedAt: startDate.Add(time.Hour).Unix(), PromptTokens: 10, CompletionTokens: 3},
		{TokenId: 7, Type: LogTypeConsume, CreatedAt: startDate.Add(2 * time.Hour).Unix(), PromptTokens: 20, CompletionTokens: 5},
		{TokenId: 7, Type: LogTypeConsume, CreatedAt: endDate.Add(23*time.Hour + 59*time.Minute).Unix(), PromptTokens: 7, CompletionTokens: 2},
		{TokenId: 7, Type: LogTypeError, CreatedAt: startDate.Add(time.Hour).Unix(), PromptTokens: 100, CompletionTokens: 100},
		{TokenId: 8, Type: LogTypeConsume, CreatedAt: startDate.Add(time.Hour).Unix(), PromptTokens: 100, CompletionTokens: 100},
	}
	require.NoError(t, db.Create(&logs).Error)

	daily, err := GetTokenDailyUsage(7, startDate, endDate)
	require.NoError(t, err)
	require.Len(t, daily, 3)
	assert.Equal(t, TokenDailyUsage{Date: "2026-07-25", InputTokens: 30, OutputTokens: 8, TotalTokens: 38, SuccessfulRequests: 2}, daily[0])
	assert.Equal(t, TokenDailyUsage{Date: "2026-07-26"}, daily[1])
	assert.Equal(t, TokenDailyUsage{Date: "2026-07-27", InputTokens: 7, OutputTokens: 2, TotalTokens: 9, SuccessfulRequests: 1}, daily[2])
}
