package controller

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildVLLMMonitoringSummaryUsesFreshEnabledInstances(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.VLLMMetricSample{}, &model.VLLMMetricAggregate{}))

	now := time.Date(2026, time.July, 15, 12, 0, 0, 0, time.UTC)
	baseURL := "http://172.16.0.72:8000"
	disabledURL := "http://172.16.0.73:8000"
	historicalURL := "http://172.16.0.74:8000"
	require.NoError(t, db.Create([]model.Channel{
		{Id: 1, Name: "vllm-a", Group: "default", Models: "dataspace-31b", Status: common.ChannelStatusEnabled, BaseURL: &baseURL},
		{Id: 2, Name: "disabled-vllm", Group: "default", Models: "dataspace-31b", Status: common.ChannelStatusManuallyDisabled, BaseURL: &disabledURL},
		{Id: 3, Name: "vllm-history", Group: "default", Models: "dataspace-31b", Status: common.ChannelStatusEnabled, BaseURL: &historicalURL},
	}).Error)

	outputRate := 30.0
	decodeRate := 22.0
	ttftMilliseconds := 180.0
	kvUsage := 65.0
	cacheHitRate := 72.0
	capacity := 8.5
	require.NoError(t, db.Create([]model.VLLMMetricSample{
		{
			ChannelID: 1, Endpoint: baseURL, RunningRequests: 3, WaitingRequests: 1,
			OutputTokensPerSecond: &outputRate, DecodeTokensPerSecond: &decodeRate,
			TTFTMilliseconds: &ttftMilliseconds, KVCacheUsagePercent: &kvUsage,
			PrefixCacheHitRate: &cacheHitRate, KVCacheMaxConcurrency: &capacity,
			CollectedAt: now.Add(-10 * time.Second).Unix(),
		},
		{ChannelID: 2, Endpoint: disabledURL, RunningRequests: 9, WaitingRequests: 9, CollectedAt: now.Add(-10 * time.Second).Unix()},
	}).Error)
	require.NoError(t, db.Create(&model.VLLMMetricAggregate{
		ChannelID: 1, Endpoint: baseURL, BucketAt: now.Add(-5 * time.Minute).Unix(),
		SampleCount: 2, AverageRunningRequests: 2, MaxWaitingRequests: 1,
		OutputTokensPerSecondTotal: 50, OutputTokensPerSecondCount: 2,
		DecodeTokensPerSecondTotal: 40, DecodeTokensPerSecondCount: 2,
		TTFTMillisecondsTotal: 400, TTFTMillisecondsCount: 2,
		KVCacheUsagePercentTotal: 120, KVCacheUsagePercentCount: 2,
		PrefixCacheHitRateTotal: 140, PrefixCacheHitRateCount: 2,
		KVCacheMaxConcurrencyTotal: 17, KVCacheMaxConcurrencyCount: 2,
	}).Error)
	require.NoError(t, db.Create(&model.VLLMMetricAggregate{
		ChannelID: 3, Endpoint: historicalURL, BucketAt: now.Add(-5 * time.Minute).Unix(),
		SampleCount: 4, AverageRunningRequests: 1, MaxWaitingRequests: 2,
		OutputTokensPerSecondTotal: 80, OutputTokensPerSecondCount: 4,
		DecodeTokensPerSecondTotal: 100, DecodeTokensPerSecondCount: 4,
		TTFTMillisecondsTotal: 600, TTFTMillisecondsCount: 4,
		KVCacheUsagePercentTotal: 240, KVCacheUsagePercentCount: 4,
		PrefixCacheHitRateTotal: 320, PrefixCacheHitRateCount: 4,
		KVCacheMaxConcurrencyTotal: 32, KVCacheMaxConcurrencyCount: 4,
	}).Error)

	summary, err := buildVLLMMonitoringSummary(now)

	require.NoError(t, err)
	require.Len(t, summary.Instances, 1)
	assert.Equal(t, "vllm-a", summary.Instances[0].ChannelName)
	assert.Equal(t, 3, summary.Metrics.RunningRequests)
	assert.Equal(t, 1, summary.Metrics.WaitingRequests)
	assert.InDelta(t, 30, summary.Metrics.OutputTokensPerSecond, 0.001)
	assert.InDelta(t, 22, summary.Metrics.DecodeTokensPerSecond, 0.001)
	assert.InDelta(t, 180, summary.Metrics.TTFTMilliseconds, 0.001)
	assert.InDelta(t, 72, summary.Metrics.PrefixCacheHitRate, 0.001)
	require.Len(t, summary.History, 1)
	assert.InDelta(t, 45, summary.History[0].OutputTokensPerSecond, 0.001)
	assert.InDelta(t, 23.333, summary.History[0].DecodeTokensPerSecond, 0.001)
	assert.InDelta(t, 166.667, summary.History[0].TTFTMilliseconds, 0.001)
}
