package controller

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildMonitorHistoryUsesLatestHeartbeatForEachHour(t *testing.T) {
	now := time.Date(2026, time.July, 13, 10, 59, 0, 0, time.Local)
	heartbeats := []uptimeHeartbeat{
		{Status: 0, Time: "2026-07-13 09:05:00.000", Ping: 100},
		{Status: 0, Time: "2026-07-13 10:05:00.000", Ping: 120},
		{Status: 1, Time: "2026-07-13 10:55:00.000", Ping: 80},
	}

	history := buildMonitorHistory(heartbeats, now)

	require.Len(t, history, uptimeHistoryHours)
	assert.Equal(t, -1, history[0].Status)
	assert.Equal(t, 0, history[uptimeHistoryHours-2].Status)
	assert.Equal(t, 1, history[uptimeHistoryHours-1].Status)
	assert.Equal(t, now.Truncate(time.Hour).Unix(), history[uptimeHistoryHours-1].Timestamp)
}

func TestBuildMonitorHistoryMarksHoursWithoutHeartbeatsAsUnknown(t *testing.T) {
	now := time.Date(2026, time.July, 13, 10, 59, 0, 0, time.Local)

	history := buildMonitorHistory(nil, now)

	require.Len(t, history, uptimeHistoryHours)
	for _, point := range history {
		assert.Equal(t, -1, point.Status)
	}
}
