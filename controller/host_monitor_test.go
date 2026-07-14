package controller

import (
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	hostmonitor "github.com/QuantumNous/new-api/service/host_monitor"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildHostMonitoringSummaryUsesLatestFreshSamplesAndAssociatesChannels(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.HostMonitor{}, &model.HostMetricSample{}))

	now := time.Date(2026, time.July, 14, 12, 0, 0, 0, time.UTC)
	firstHost := &model.HostMonitor{Name: "node-a", Address: "172.16.0.72", Port: 22, Username: "monitor", PrivateKeyEncrypted: "ciphertext", Enabled: true}
	secondHost := &model.HostMonitor{Name: "node-b", Address: "172.16.0.73", Port: 22, Username: "monitor", PrivateKeyEncrypted: "ciphertext", Enabled: true}
	require.NoError(t, model.CreateHostMonitor(firstHost))
	require.NoError(t, model.CreateHostMonitor(secondHost))

	baseURL := "http://172.16.0.72:8000"
	require.NoError(t, db.Create(&model.Channel{Id: 1, Name: "dataspace-31b", Models: "dataspace-31b", Status: common.ChannelStatusEnabled, BaseURL: &baseURL}).Error)
	gpuJSON, err := common.Marshal([]hostmonitor.GPUMetric{{Index: 0, Name: "H100", UUID: "GPU-1", UtilizationPercent: 80, MemoryUsedBytes: 40, MemoryTotalBytes: 80, TemperatureC: 60, PowerWatts: 350}})
	require.NoError(t, err)
	require.NoError(t, model.CreateHostMetricSample(&model.HostMetricSample{HostMonitorID: firstHost.Id, Online: true, CPUPercent: 42, MemoryTotalBytes: 100, MemoryUsedBytes: 50, GPUsJSON: string(gpuJSON), CollectedAt: now.Add(-30 * time.Second).Unix()}))
	require.NoError(t, model.CreateHostMetricSample(&model.HostMetricSample{HostMonitorID: secondHost.Id, Online: true, CPUPercent: 90, MemoryTotalBytes: 100, MemoryUsedBytes: 80, CollectedAt: now.Add(-2 * time.Minute).Unix()}))

	summary, err := buildHostMonitoringSummary(now)

	require.NoError(t, err)
	assert.Equal(t, int64(2), summary.Metrics.TotalHosts)
	assert.Equal(t, int64(1), summary.Metrics.OnlineHosts)
	assert.InDelta(t, 42, summary.Metrics.AverageCPUPercent, 0.01)
	assert.InDelta(t, 80, summary.Metrics.AverageGPUPercent, 0.01)
	require.Len(t, summary.Hosts, 2)
	assert.True(t, summary.Hosts[0].Online)
	assert.Len(t, summary.Hosts[0].Channels, 1)
	assert.Equal(t, "dataspace-31b", summary.Hosts[0].Channels[0].Name)
	assert.False(t, summary.Hosts[1].Online)
}

func TestHostMonitorResponseNeverContainsPrivateKey(t *testing.T) {
	response := newHostMonitorResponse(model.HostMonitor{Id: 1, Name: "node", Address: "172.16.0.72", Port: 22, Username: "monitor", PrivateKeyEncrypted: "v1:secret", Enabled: true})
	data, err := common.Marshal(response)
	require.NoError(t, err)
	assert.NotContains(t, string(data), "\"private_key\"")
	assert.NotContains(t, string(data), "secret")
	assert.True(t, response.PrivateKeyConfigured)
	assert.False(t, strings.Contains(string(data), "v1:"))
}
