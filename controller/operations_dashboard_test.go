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
		&model.VLLMMetricSample{},
		&model.VLLMMetricAggregate{},
		&model.PerfMetric{},
		&model.QuotaData{},
		&model.Log{},
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
		{ModelName: "alpha", Group: "default", BucketTs: now.Add(-time.Hour).Unix(), RequestCount: 30, SuccessCount: 28, TotalLatencyMs: 3000, OutputTokens: 600, GenerationMs: 20000},
		{ModelName: "beta", Group: "default", BucketTs: now.Add(-2 * time.Hour).Unix(), RequestCount: 10, SuccessCount: 10, TotalLatencyMs: 2000, OutputTokens: 100, GenerationMs: 10000},
		{ModelName: "alpha", Group: "default", BucketTs: now.Unix(), RequestCount: 4, SuccessCount: 3, TotalLatencyMs: 800, OutputTokens: 90, GenerationMs: 3000},
	}).Error)
	require.NoError(t, db.Create([]model.Log{
		{UserId: 1, Username: "user-1", ModelName: "alpha", Type: model.LogTypeConsume, CreatedAt: now.Add(-5 * time.Minute).Unix(), PromptTokens: 100, CompletionTokens: 50, UseTime: 1},
		{UserId: 2, Username: "user-2", ModelName: "beta", Type: model.LogTypeConsume, CreatedAt: now.Add(-10 * time.Minute).Unix(), PromptTokens: 80, CompletionTokens: 20, UseTime: 2},
		{UserId: 1, Username: "user-1", ModelName: "alpha", Type: model.LogTypeError, CreatedAt: now.Add(-3 * time.Minute).Unix(), UseTime: 3},
	}).Error)
	tokensPerSecond := 27.4
	maxConcurrency := 5
	require.NoError(t, db.Create([]model.ChannelHealthCheck{
		{ChannelID: 1, Status: 1, ResponseTime: 50, TokensPerSecond: &tokensPerSecond, MaxConcurrency: &maxConcurrency, CheckedAt: now.Add(-time.Minute).Unix()},
		{ChannelID: 2, Status: 0, ResponseTime: 1250, CheckedAt: now.Add(-2 * time.Minute).Unix()},
		{ChannelID: 3, Status: 1, ResponseTime: 10, CheckedAt: now.Add(-time.Minute).Unix()},
	}).Error)
	vllmOutputRate := 30.0
	vllmDecodeRate := 22.0
	vllmTTFT := 180.0
	vllmCacheHitRate := 72.0
	require.NoError(t, db.Create(&model.VLLMMetricSample{
		ChannelID: 1, Endpoint: baseURL, RunningRequests: 3, WaitingRequests: 1,
		OutputTokensPerSecond: &vllmOutputRate, DecodeTokensPerSecond: &vllmDecodeRate,
		TTFTMilliseconds: &vllmTTFT, PrefixCacheHitRate: &vllmCacheHitRate,
		CollectedAt: now.Add(-10 * time.Second).Unix(),
	}).Error)

	summary, err := buildOperationsDashboardSummary(now)

	require.NoError(t, err)
	assert.Equal(t, int64(2), summary.Metrics.ActiveUsers)
	assert.Equal(t, int64(2), summary.Metrics.EnabledChannels)
	assert.Equal(t, int64(1), summary.Metrics.HealthyChannels)
	assert.Equal(t, int64(2), summary.Metrics.ActiveModels)
	assert.Equal(t, int64(44), summary.Metrics.Requests24h)
	assert.Equal(t, int64(250), summary.Metrics.TotalTokens24h)
	assert.Equal(t, int64(1), summary.Metrics.UnavailableChannels)
	assert.Equal(t, int64(0), summary.Metrics.SlowChannels)
	assert.InDelta(t, 66.67, summary.Metrics.GatewaySuccessRate15m, 0.01)
	assert.InDelta(t, 2000, summary.Metrics.GatewayAverageLatencyMs15m, 0.001)
	assert.InDelta(t, 3000, summary.Metrics.GatewayP95LatencyMs15m, 0.001)
	require.Len(t, summary.Traffic, 25)
	assert.Equal(t, now.Unix(), summary.Traffic[len(summary.Traffic)-1].Timestamp)
	assert.Equal(t, int64(4), summary.Traffic[len(summary.Traffic)-1].RequestCount)
	assert.Equal(t, 100.0, summary.Traffic[0].SuccessRate)
	require.Len(t, summary.Models, 2)
	assert.Equal(t, "alpha", summary.Models[0].Name)
	require.Len(t, summary.Users, 2)
	assert.Equal(t, "user-1", summary.Users[0].Name)
	assert.Equal(t, int64(150), summary.Users[0].TokenUsed)
	assert.Equal(t, int64(3), summary.Traffic[len(summary.Traffic)-1].SuccessfulRequests)
	assert.Equal(t, int64(1), summary.Traffic[len(summary.Traffic)-1].FailedRequests)
	assert.ElementsMatch(t, []string{"channel_down", "model_low_success"}, operationAlertTypes(summary.Alerts))
}

func TestBuildOperationsDashboardSummaryTreatsAnIdleGatewayAsFullySuccessful(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(
		&model.ChannelHealthCheck{},
		&model.PerfMetric{},
		&model.QuotaData{},
		&model.Log{},
	))

	now := time.Date(2026, time.July, 16, 12, 0, 0, 0, time.UTC)
	summary, err := buildOperationsDashboardSummary(now)

	require.NoError(t, err)
	assert.Equal(t, int64(0), summary.Metrics.GatewayCalls15m)
	assert.Equal(t, 100.0, summary.Metrics.GatewaySuccessRate15m)
	assert.NotEmpty(t, summary.Traffic)
	assert.Equal(t, 100.0, summary.Traffic[0].SuccessRate)
}

func operationAlertTypes(alerts []operationsDashboardAlert) []string {
	types := make([]string, 0, len(alerts))
	for _, alert := range alerts {
		types = append(types, alert.Type)
	}
	return types
}
