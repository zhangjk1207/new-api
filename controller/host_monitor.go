package controller

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	hostmonitor "github.com/QuantumNous/new-api/service/host_monitor"
	"github.com/gin-gonic/gin"
)

const (
	hostMonitoringHistoryHours = 24
	hostMonitoringStaleAfter   = 60 * time.Second
)

type hostMonitorRequest struct {
	Name       string `json:"name"`
	Address    string `json:"address"`
	Port       int    `json:"port"`
	Username   string `json:"username"`
	PrivateKey string `json:"private_key"`
	Enabled    *bool  `json:"enabled"`
}

type hostMonitorResponse struct {
	Id                   int       `json:"id"`
	Name                 string    `json:"name"`
	Address              string    `json:"address"`
	Port                 int       `json:"port"`
	Username             string    `json:"username"`
	Enabled              bool      `json:"enabled"`
	PrivateKeyConfigured bool      `json:"private_key_configured"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type hostMonitoringChannel struct {
	Id     int    `json:"id"`
	Name   string `json:"name"`
	Models string `json:"models"`
}

type hostMonitoringHistoryPoint struct {
	Timestamp        int64   `json:"timestamp"`
	CPUPercent       float64 `json:"cpu_percent"`
	MemoryTotalBytes int64   `json:"memory_total_bytes"`
	MemoryUsedBytes  int64   `json:"memory_used_bytes"`
	Online           bool    `json:"online"`
}

type hostMonitoringHost struct {
	hostMonitorResponse
	Online           bool                         `json:"online"`
	LastCollectedAt  int64                        `json:"last_collected_at"`
	CPUPercent       float64                      `json:"cpu_percent"`
	MemoryTotalBytes int64                        `json:"memory_total_bytes"`
	MemoryUsedBytes  int64                        `json:"memory_used_bytes"`
	GPUs             []hostmonitor.GPUMetric      `json:"gpus"`
	Channels         []hostMonitoringChannel      `json:"channels"`
	History          []hostMonitoringHistoryPoint `json:"history"`
	ErrorMessage     string                       `json:"error_message,omitempty"`
}

type hostMonitoringMetrics struct {
	TotalHosts           int64   `json:"total_hosts"`
	OnlineHosts          int64   `json:"online_hosts"`
	AverageCPUPercent    float64 `json:"average_cpu_percent"`
	AverageMemoryPercent float64 `json:"average_memory_percent"`
	AverageGPUPercent    float64 `json:"average_gpu_percent"`
	GPUUsedBytes         int64   `json:"gpu_used_bytes"`
	GPUTotalBytes        int64   `json:"gpu_total_bytes"`
}

type hostMonitoringSummary struct {
	UpdatedAt int64                 `json:"updated_at"`
	Metrics   hostMonitoringMetrics `json:"metrics"`
	Hosts     []hostMonitoringHost  `json:"hosts"`
}

func newHostMonitorResponse(host model.HostMonitor) hostMonitorResponse {
	return hostMonitorResponse{
		Id:                   host.Id,
		Name:                 host.Name,
		Address:              host.Address,
		Port:                 host.Port,
		Username:             host.Username,
		Enabled:              host.Enabled,
		PrivateKeyConfigured: strings.TrimSpace(host.PrivateKeyEncrypted) != "",
		CreatedAt:            host.CreatedAt,
		UpdatedAt:            host.UpdatedAt,
	}
}

func parseHostMonitorID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, fmt.Errorf("invalid host monitor ID")
	}
	return id, nil
}

func ListHostMonitors(c *gin.Context) {
	hosts, err := model.ListHostMonitors()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	responses := make([]hostMonitorResponse, 0, len(hosts))
	for _, host := range hosts {
		responses = append(responses, newHostMonitorResponse(host))
	}
	common.ApiSuccess(c, responses)
}

func CreateHostMonitor(c *gin.Context) {
	var req hostMonitorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid host monitor request")
		return
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	host := model.HostMonitor{Name: strings.TrimSpace(req.Name), Address: strings.TrimSpace(req.Address), Port: req.Port, Username: strings.TrimSpace(req.Username), Enabled: enabled}
	if err := hostmonitor.ValidateHostInput(host, req.PrivateKey, true); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	ciphertext, err := hostmonitor.EncryptPrivateKey(req.PrivateKey)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	host.PrivateKeyEncrypted = ciphertext
	if err := model.CreateHostMonitor(&host); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, newHostMonitorResponse(host))
}

func UpdateHostMonitor(c *gin.Context) {
	id, err := parseHostMonitorID(c)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	host, err := model.GetHostMonitorByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req hostMonitorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid host monitor request")
		return
	}
	host.Name = strings.TrimSpace(req.Name)
	host.Address = strings.TrimSpace(req.Address)
	host.Port = req.Port
	host.Username = strings.TrimSpace(req.Username)
	if req.Enabled != nil {
		host.Enabled = *req.Enabled
	}
	if err := hostmonitor.ValidateHostInput(*host, req.PrivateKey, false); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if strings.TrimSpace(req.PrivateKey) != "" {
		ciphertext, err := hostmonitor.EncryptPrivateKey(req.PrivateKey)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		host.PrivateKeyEncrypted = ciphertext
	}
	if err := model.UpdateHostMonitor(host); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, newHostMonitorResponse(*host))
}

func DeleteHostMonitor(c *gin.Context) {
	id, err := parseHostMonitorID(c)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if err := model.DeleteHostMonitor(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func TestHostMonitor(c *gin.Context) {
	id, err := parseHostMonitorID(c)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	host, err := model.GetHostMonitorByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	snapshot, err := hostmonitor.CollectHost(*host)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, snapshot)
}

func GetHostMonitoringSummary(c *gin.Context) {
	summary, err := buildHostMonitoringSummary(time.Now())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, summary)
}

func buildHostMonitoringSummary(now time.Time) (hostMonitoringSummary, error) {
	summary := hostMonitoringSummary{UpdatedAt: now.Unix(), Hosts: make([]hostMonitoringHost, 0)}
	hosts, err := model.ListHostMonitors()
	if err != nil {
		return summary, err
	}
	hostIDs := make([]int, 0, len(hosts))
	for _, host := range hosts {
		if host.Enabled {
			hostIDs = append(hostIDs, host.Id)
		}
	}
	samples, err := model.ListHostMetricSamplesSince(hostIDs, now.Add(-hostMonitoringHistoryHours*time.Hour).Unix())
	if err != nil {
		return summary, err
	}
	samplesByHost := make(map[int][]model.HostMetricSample, len(hostIDs))
	for _, sample := range samples {
		samplesByHost[sample.HostMonitorID] = append(samplesByHost[sample.HostMonitorID], sample)
	}

	channels, err := enabledHostMonitoringChannels()
	if err != nil {
		return summary, err
	}
	staleBefore := now.Add(-hostMonitoringStaleAfter).Unix()
	var cpuTotal float64
	var memoryPercentTotal float64
	var gpuPercentTotal float64
	var gpuCount int64
	for _, host := range hosts {
		if !host.Enabled {
			continue
		}
		item := hostMonitoringHost{
			hostMonitorResponse: newHostMonitorResponse(host),
			GPUs:                make([]hostmonitor.GPUMetric, 0),
			Channels:            channelReferencesForHost(host.Address, channels),
			History:             make([]hostMonitoringHistoryPoint, 0),
		}
		hostSamples := samplesByHost[host.Id]
		for _, sample := range hostSamples {
			item.History = append(item.History, hostMonitoringHistoryPoint{Timestamp: sample.CollectedAt, CPUPercent: sample.CPUPercent, MemoryTotalBytes: sample.MemoryTotalBytes, MemoryUsedBytes: sample.MemoryUsedBytes, Online: sample.Online})
		}
		if len(hostSamples) > 0 {
			latest := hostSamples[len(hostSamples)-1]
			item.LastCollectedAt = latest.CollectedAt
			item.Online = latest.Online && latest.CollectedAt >= staleBefore
			item.CPUPercent = latest.CPUPercent
			item.MemoryTotalBytes = latest.MemoryTotalBytes
			item.MemoryUsedBytes = latest.MemoryUsedBytes
			item.ErrorMessage = latest.ErrorMessage
			if latest.GPUsJSON != "" {
				if err := common.Unmarshal([]byte(latest.GPUsJSON), &item.GPUs); err != nil {
					return summary, err
				}
			}
		}
		summary.Metrics.TotalHosts++
		if item.Online {
			summary.Metrics.OnlineHosts++
			cpuTotal += item.CPUPercent
			if item.MemoryTotalBytes > 0 {
				memoryPercentTotal += float64(item.MemoryUsedBytes) / float64(item.MemoryTotalBytes) * 100
			}
			for _, gpu := range item.GPUs {
				gpuPercentTotal += gpu.UtilizationPercent
				gpuCount++
				summary.Metrics.GPUUsedBytes += gpu.MemoryUsedBytes
				summary.Metrics.GPUTotalBytes += gpu.MemoryTotalBytes
			}
		}
		summary.Hosts = append(summary.Hosts, item)
	}
	if summary.Metrics.OnlineHosts > 0 {
		summary.Metrics.AverageCPUPercent = cpuTotal / float64(summary.Metrics.OnlineHosts)
		summary.Metrics.AverageMemoryPercent = memoryPercentTotal / float64(summary.Metrics.OnlineHosts)
	}
	if gpuCount > 0 {
		summary.Metrics.AverageGPUPercent = gpuPercentTotal / float64(gpuCount)
	}
	return summary, nil
}

func enabledHostMonitoringChannels() ([]model.Channel, error) {
	channels := make([]model.Channel, 0)
	err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error
	return channels, err
}

func channelReferencesForHost(address string, channels []model.Channel) []hostMonitoringChannel {
	refs := make([]hostMonitoringChannel, 0)
	for _, channel := range channels {
		baseURL, err := url.Parse(channel.GetBaseURL())
		if err != nil || !strings.EqualFold(baseURL.Hostname(), address) {
			continue
		}
		refs = append(refs, hostMonitoringChannel{Id: channel.Id, Name: channel.Name, Models: channel.Models})
	}
	return refs
}
