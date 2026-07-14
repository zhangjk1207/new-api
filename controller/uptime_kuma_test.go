package controller

import (
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseVLLMMetricsCombinesTokensAndRoundsConcurrency(t *testing.T) {
	metrics, err := parseVLLMMetrics(strings.NewReader(`
# TYPE vllm:prompt_tokens_total counter
vllm:prompt_tokens_total{engine="0"} 125
# TYPE vllm:generation_tokens_total counter
vllm:generation_tokens_total{engine="0"} 75
# TYPE vllm:cache_config_info gauge
vllm:cache_config_info{kv_cache_max_concurrency="4.6"} 1
`))

	require.NoError(t, err)
	assert.Equal(t, 200.0, metrics.TokenCount)
	require.NotNil(t, metrics.MaxConcurrency)
	assert.Equal(t, 5, *metrics.MaxConcurrency)
}

func TestCalculateTokensPerSecondRequiresAnIncreasingCounter(t *testing.T) {
	previousTime := time.Date(2026, time.July, 13, 10, 0, 0, 0, time.UTC)
	currentTime := previousTime.Add(10 * time.Second)

	rate, ok := calculateTokensPerSecond(100, previousTime, 160, currentTime)

	require.True(t, ok)
	assert.Equal(t, 6.0, rate)
	_, ok = calculateTokensPerSecond(160, previousTime, 100, currentTime)
	assert.False(t, ok)
}

func TestBuildMonitorHistoryKeepsIndividualHeartbeats(t *testing.T) {
	now := time.Date(2026, time.July, 13, 10, 59, 0, 0, time.UTC)
	heartbeats := []uptimeHeartbeat{
		{Status: 0, Time: "2026-07-13 09:05:00.000", Ping: 100},
		{Status: 0, Time: "2026-07-13 10:05:00.000", Ping: 120},
		{Status: 1, Time: "2026-07-13 10:55:00.000", Ping: 80},
	}

	history := buildMonitorHistory(heartbeats, now)

	require.Len(t, history, 3)
	assert.Equal(t, time.Date(2026, time.July, 13, 9, 5, 0, 0, time.UTC).Unix(), history[0].Timestamp)
	assert.Equal(t, 0, history[0].Status)
	assert.Equal(t, 100.0, history[0].ResponseTime)
	assert.Equal(t, time.Date(2026, time.July, 13, 10, 55, 0, 0, time.UTC).Unix(), history[2].Timestamp)
	assert.Equal(t, 1, history[2].Status)
	assert.Equal(t, 80.0, history[2].ResponseTime)
}

func TestBuildMonitorHistoryExcludesHeartbeatsOutsideTheLastDay(t *testing.T) {
	now := time.Date(2026, time.July, 13, 10, 59, 0, 0, time.UTC)
	heartbeats := []uptimeHeartbeat{
		{Status: 1, Time: "2026-07-12 10:58:59.000", Ping: 10},
		{Status: 1, Time: "2026-07-12 10:59:00.000", Ping: 20},
		{Status: 1, Time: "2026-07-13 10:58:00.000", Ping: 30},
	}

	history := buildMonitorHistory(heartbeats, now)

	require.Len(t, history, 2)
	assert.Equal(t, 20.0, history[0].ResponseTime)
	assert.Equal(t, 30.0, history[1].ResponseTime)
}

func TestParseUptimeHeartbeatTimeTreatsKumaTimestampsAsUTC(t *testing.T) {
	parsed, err := parseUptimeHeartbeatTime("2026-07-14 02:48:35.000")

	require.NoError(t, err)
	assert.Equal(t, time.UTC, parsed.Location())
	assert.Equal(t, "2026-07-14 10:48:35", parsed.In(time.FixedZone("CST", 8*60*60)).Format("2006-01-02 15:04:05"))
}

func TestReconcileEnabledChannelMonitorsUsesEnabledChannelsAsSourceOfTruth(t *testing.T) {
	tokensPerSecond := 32.5
	maxConcurrency := 4
	channels := []model.Channel{
		{Name: "enabled", Group: "vip", Status: common.ChannelStatusEnabled},
		{Name: "new-channel", Group: "default", Status: common.ChannelStatusEnabled},
		{Name: "disabled", Group: "default", Status: common.ChannelStatusManuallyDisabled},
	}
	kumaMonitors := map[string]Monitor{
		"enabled": {
			Name:         "enabled",
			Status:       1,
			Uptime:       0.99,
			ResponseTime: 18,
		},
		"deleted-channel": {Name: "deleted-channel", Status: 1},
	}
	metrics := map[string]vllmMetrics{
		"enabled": {
			TokensPerSecond: &tokensPerSecond,
			MaxConcurrency:  &maxConcurrency,
		},
	}

	monitors := reconcileEnabledChannelMonitors(channels, kumaMonitors, metrics, time.Now())

	require.Len(t, monitors, 2)
	assert.Equal(t, "enabled", monitors[0].Name)
	assert.Equal(t, "vip", monitors[0].Group)
	assert.Equal(t, 1, monitors[0].Status)
	assert.Equal(t, &tokensPerSecond, monitors[0].TokensPerSecond)
	assert.Equal(t, &maxConcurrency, monitors[0].MaxConcurrency)
	assert.Equal(t, "new-channel", monitors[1].Name)
	assert.Equal(t, "default", monitors[1].Group)
	assert.Equal(t, -1, monitors[1].Status)
}
