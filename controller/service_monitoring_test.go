package controller

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetNativeServiceMonitoringUsesLocalHealthChecks(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.ChannelHealthCheck{}))

	baseURL := "http://127.0.0.1:8000"
	require.NoError(t, db.Create(&model.Channel{
		Id:      1,
		Name:    "enabled-channel",
		Group:   "default",
		Status:  common.ChannelStatusEnabled,
		BaseURL: &baseURL,
	}).Error)
	require.NoError(t, db.Create(&model.Channel{
		Id:      2,
		Name:    "disabled-channel",
		Group:   "default",
		Status:  common.ChannelStatusManuallyDisabled,
		BaseURL: &baseURL,
	}).Error)

	now := time.Now().Unix()
	require.NoError(t, db.Create([]model.ChannelHealthCheck{
		{ChannelID: 1, Status: 0, ResponseTime: 30, CheckedAt: now - 60*60},
		{ChannelID: 1, Status: 2, ResponseTime: 25, CheckedAt: now - 30*60},
		{ChannelID: 1, Status: 1, ResponseTime: 15, CheckedAt: now - 60},
		{ChannelID: 2, Status: 1, ResponseTime: 10, CheckedAt: now - 60},
	}).Error)

	results, err := getNativeServiceMonitoring(time.Unix(now, 0))

	require.NoError(t, err)
	require.Len(t, results, 1)
	require.Len(t, results[0].Monitors, 1)
	monitor := results[0].Monitors[0]
	assert.Equal(t, "enabled-channel", monitor.Name)
	assert.Equal(t, 1, monitor.Status)
	assert.Equal(t, 15.0, monitor.ResponseTime)
	assert.InDelta(t, 2.0/3.0, monitor.Uptime, 0.001)
	require.Len(t, monitor.History, 3)
}
