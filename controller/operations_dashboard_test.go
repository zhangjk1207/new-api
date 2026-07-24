package controller

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildOperationsDashboardSummaryAggregatesOperationalData(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(
		&model.ChannelHealthCheck{},
		&model.PerfMetric{},
		&model.QuotaData{},
	))

	now := time.Date(2026, time.July, 14, 12, 0, 0, 0, time.UTC)
	baseURL := "http://127.0.0.1:8000"
	require.NoError(t, db.Create([]model.Channel{
		{Id: 1, Name: "healthy", Group: "default", Status: common.ChannelStatusEnabled, BaseURL: &baseURL},
		{Id: 2, Name: "unhealthy", Group: "default", Status: common.ChannelStatusEnabled, BaseURL: &baseURL},
		{Id: 3, Name: "disabled", Group: "default", Status: common.ChannelStatusManuallyDisabled, BaseURL: &baseURL},
	}).Error)
	require.NoError(t, db.Create([]model.QuotaData{
		{UserID: 1, Username: "user-1", ModelName: "alpha", CreatedAt: now.Add(-time.Hour).Unix(), Count: 2},
		{UserID: 2, Username: "user-2", ModelName: "beta", CreatedAt: now.Add(-2 * time.Hour).Unix(), Count: 1},
	}).Error)
	require.NoError(t, db.Create([]model.PerfMetric{
		{ModelName: "alpha", Group: "default", BucketTs: now.Add(-10 * time.Minute).Unix(), RequestCount: 30, SuccessCount: 28, TotalLatencyMs: 3000, OutputTokens: 600, GenerationMs: 20000},
		{ModelName: "beta", Group: "default", BucketTs: now.Add(-20 * time.Minute).Unix(), RequestCount: 10, SuccessCount: 10, TotalLatencyMs: 2000, OutputTokens: 100, GenerationMs: 10000},
	}).Error)
	tokensPerSecond := 27.4
	maxConcurrency := 5
	require.NoError(t, db.Create([]model.ChannelHealthCheck{
		{ChannelID: 1, Status: 1, ResponseTime: 50, TokensPerSecond: &tokensPerSecond, MaxConcurrency: &maxConcurrency, CheckedAt: now.Add(-5 * time.Minute).Unix()},
		{ChannelID: 2, Status: 0, ResponseTime: 1250, CheckedAt: now.Add(-3 * time.Minute).Unix()},
		{ChannelID: 3, Status: 1, ResponseTime: 10, CheckedAt: now.Add(-time.Minute).Unix()},
	}).Error)

	summary, err := buildOperationsDashboardSummary(now)

	require.NoError(t, err)
	assert.Equal(t, int64(2), summary.Metrics.ActiveUsers)
	assert.Equal(t, int64(2), summary.Metrics.EnabledChannels)
	assert.Equal(t, int64(1), summary.Metrics.HealthyChannels)
	assert.Equal(t, int64(2), summary.Metrics.ActiveModels)
	assert.Equal(t, 27.4, summary.Metrics.TokensPerSecond)
	assert.Equal(t, 5, summary.Metrics.MaxConcurrency)
	assert.Equal(t, 50.0, summary.Metrics.SuccessRate15m)
	assert.Equal(t, 1250.0, summary.Metrics.P95LatencyMs)
	require.Len(t, summary.Traffic, 2)
	require.Len(t, summary.Models, 2)
	assert.Equal(t, "alpha", summary.Models[0].Name)
	assert.ElementsMatch(t, []string{"channel_down", "channel_slow", "model_low_success"}, operationAlertTypes(summary.Alerts))
}

func TestBuildOperationsDashboardSummaryTreatsPendingHealthAsAvailable(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.ChannelHealthCheck{}, &model.PerfMetric{}, &model.QuotaData{}, &model.Log{}))

	now := time.Date(2026, time.July, 16, 12, 0, 0, 0, time.UTC)
	baseURL := "http://127.0.0.1:8000"
	require.NoError(t, db.Create(&model.Channel{
		Id: 1, Name: "pending", Status: common.ChannelStatusEnabled, BaseURL: &baseURL,
	}).Error)
	require.NoError(t, db.Create(&model.ChannelHealthCheck{
		ChannelID: 1, Status: 2, ResponseTime: 10_000, CheckedAt: now.Add(-time.Minute).Unix(),
	}).Error)

	summary, err := buildOperationsDashboardSummary(now)

	require.NoError(t, err)
	assert.Equal(t, int64(1), summary.Metrics.HealthyChannels)
	assert.NotContains(t, operationAlertTypes(summary.Alerts), "channel_down")
}

func operationAlertTypes(alerts []operationsDashboardAlert) []string {
	types := make([]string, 0, len(alerts))
	for _, alert := range alerts {
		types = append(types, alert.Type)
	}
	return types
}
