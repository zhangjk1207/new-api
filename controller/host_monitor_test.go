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
	require.NoError(t, db.AutoMigrate(&model.HostMonitor{}, &model.HostMetricSample{}, &model.VLLMMetricSample{}, &model.VLLMMetricAggregate{}))

	now := time.Date(2026, time.July, 14, 12, 0, 0, 0, time.UTC)
	firstHost := &model.HostMonitor{Name: "node-a", Address: "172.16.0.72", Port: 22, Username: "monitor", PrivateKeyEncrypted: "ciphertext", Enabled: true}
	secondHost := &model.HostMonitor{Name: "node-b", Address: "172.16.0.73", Port: 22, Username: "monitor", PrivateKeyEncrypted: "ciphertext", Enabled: true}
	require.NoError(t, model.CreateHostMonitor(firstHost))
	require.NoError(t, model.CreateHostMonitor(secondHost))

	baseURL := "http://172.16.0.72:8000"
	require.NoError(t, db.Create(&model.Channel{Id: 1, Name: "dataspace-31b", Models: "dataspace-31b", Status: common.ChannelStatusEnabled, BaseURL: &baseURL}).Error)
	secondBaseURL := "http://172.16.0.72:8001"
	require.NoError(t, db.Create(&model.Channel{Id: 2, Name: "dataspace-35b", Models: "dataspace-35b", Status: common.ChannelStatusEnabled, BaseURL: &secondBaseURL}).Error)
	otherHostBaseURL := "http://172.16.0.73:8000"
	require.NoError(t, db.Create(&model.Channel{Id: 3, Name: "other-host", Models: "other-host", Status: common.ChannelStatusEnabled, BaseURL: &otherHostBaseURL}).Error)
	firstGPUJSON, err := common.Marshal([]hostmonitor.GPUMetric{{Index: 0, Name: "H100", UUID: "GPU-1", UtilizationPercent: 50, MemoryUsedBytes: 40, MemoryTotalBytes: 80, TemperatureC: 60, PowerWatts: 350}})
	require.NoError(t, err)
	latestGPUJSON, err := common.Marshal([]hostmonitor.GPUMetric{{Index: 0, Name: "H100", UUID: "GPU-1", UtilizationPercent: 80, MemoryUsedBytes: 40, MemoryTotalBytes: 80, TemperatureC: 60, PowerWatts: 350}})
	require.NoError(t, err)
	require.NoError(t, model.CreateHostMetricSample(&model.HostMetricSample{HostMonitorID: firstHost.Id, Online: true, CPUPercent: 30, MemoryTotalBytes: 100, MemoryUsedBytes: 40, GPUsJSON: string(firstGPUJSON), CollectedAt: now.Add(-60 * time.Second).Unix()}))
	require.NoError(t, model.CreateHostMetricSample(&model.HostMetricSample{HostMonitorID: firstHost.Id, Online: true, CPUPercent: 42, MemoryTotalBytes: 100, MemoryUsedBytes: 50, GPUsJSON: string(latestGPUJSON), CollectedAt: now.Add(-30 * time.Second).Unix()}))
	require.NoError(t, model.CreateHostMetricSample(&model.HostMetricSample{HostMonitorID: secondHost.Id, Online: true, CPUPercent: 90, MemoryTotalBytes: 100, MemoryUsedBytes: 80, CollectedAt: now.Add(-2 * time.Minute).Unix()}))
	outputRate := 30.0
	require.NoError(t, db.Create(&model.VLLMMetricSample{ChannelID: 1, Endpoint: baseURL, RunningRequests: 3, WaitingRequests: 1, OutputTokensPerSecond: &outputRate, CollectedAt: now.Add(-10 * time.Second).Unix()}).Error)
	require.NoError(t, db.Create(&model.VLLMMetricAggregate{ChannelID: 1, Endpoint: baseURL, BucketAt: now.Add(-5 * time.Minute).Unix(), SampleCount: 1, AverageRunningRequests: 3, MaxWaitingRequests: 1, OutputTokensPerSecondTotal: 30, OutputTokensPerSecondCount: 1}).Error)
	require.NoError(t, db.Create(&model.VLLMMetricAggregate{ChannelID: 2, Endpoint: secondBaseURL, BucketAt: now.Add(-5 * time.Minute).Unix(), SampleCount: 1, AverageRunningRequests: 1.5, MaxWaitingRequests: 2, OutputTokensPerSecondTotal: 10, OutputTokensPerSecondCount: 1}).Error)
	require.NoError(t, db.Create(&model.VLLMMetricAggregate{ChannelID: 3, Endpoint: otherHostBaseURL, BucketAt: now.Add(-5 * time.Minute).Unix(), SampleCount: 1, AverageRunningRequests: 99, MaxWaitingRequests: 99, OutputTokensPerSecondTotal: 99, OutputTokensPerSecondCount: 1}).Error)

	summary, err := buildHostMonitoringSummary(now)

	require.NoError(t, err)
	assert.Equal(t, int64(2), summary.Metrics.TotalHosts)
	assert.Equal(t, int64(1), summary.Metrics.OnlineHosts)
	assert.InDelta(t, 42, summary.Metrics.AverageCPUPercent, 0.01)
	assert.InDelta(t, 80, summary.Metrics.AverageGPUPercent, 0.01)
	require.Len(t, summary.Hosts, 2)
	assert.True(t, summary.Hosts[0].Online)
	assert.Len(t, summary.Hosts[0].Channels, 2)
	assert.Equal(t, "dataspace-31b", summary.Hosts[0].Channels[0].Name)
	require.Len(t, summary.Hosts[0].GPUHistory, 1)
	assert.Equal(t, "GPU-1", summary.Hosts[0].GPUHistory[0].UUID)
	require.Len(t, summary.Hosts[0].GPUHistory[0].Points, 2)
	assert.InDelta(t, 50, summary.Hosts[0].GPUHistory[0].Points[0].UtilizationPercent, 0.001)
	assert.InDelta(t, 80, summary.Hosts[0].GPUHistory[0].Points[1].UtilizationPercent, 0.001)
	require.Len(t, summary.Hosts[0].VLLMInstances, 1)
	assert.InDelta(t, 30, *summary.Hosts[0].VLLMInstances[0].OutputTokensPerSecond, 0.001)
	serializedHost, err := common.Marshal(summary.Hosts[0])
	require.NoError(t, err)
	var hostPayload struct {
		VLLMHistory []struct {
			Timestamp             int64   `json:"timestamp"`
			OutputTokensPerSecond float64 `json:"output_tokens_per_second"`
			RunningRequests       float64 `json:"running_requests"`
			WaitingRequests       int     `json:"waiting_requests"`
		} `json:"vllm_history"`
	}
	require.NoError(t, common.Unmarshal(serializedHost, &hostPayload))
	require.Len(t, hostPayload.VLLMHistory, 1)
	assert.Equal(t, now.Add(-5*time.Minute).Unix(), hostPayload.VLLMHistory[0].Timestamp)
	assert.InDelta(t, 40, hostPayload.VLLMHistory[0].OutputTokensPerSecond, 0.001)
	assert.InDelta(t, 4.5, hostPayload.VLLMHistory[0].RunningRequests, 0.001)
	assert.Equal(t, 3, hostPayload.VLLMHistory[0].WaitingRequests)
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
