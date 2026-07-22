package controller

import (
	"net/http"
	"sort"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

const serviceMonitoringHistoryHours = 24

type Monitor struct {
	Name            string               `json:"name"`
	Uptime          float64              `json:"uptime"`
	Status          int                  `json:"status"`
	Group           string               `json:"group,omitempty"`
	ResponseTime    float64              `json:"response_time"`
	TokensPerSecond *float64             `json:"tokens_per_second,omitempty"`
	MaxConcurrency  *int                 `json:"max_concurrency,omitempty"`
	History         []uptimeHistoryPoint `json:"history"`
}

type uptimeHistoryPoint struct {
	Timestamp    int64   `json:"timestamp"`
	Status       int     `json:"status"`
	ResponseTime float64 `json:"response_time"`
}

type UptimeGroupResult struct {
	CategoryName string    `json:"categoryName"`
	Monitors     []Monitor `json:"monitors"`
}

func getEnabledMonitoringChannels() ([]model.Channel, error) {
	var channels []model.Channel
	err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error
	return channels, err
}

func getNativeServiceMonitoring(now time.Time) ([]UptimeGroupResult, error) {
	if model.DB == nil {
		return []UptimeGroupResult{}, nil
	}
	channels, err := getEnabledMonitoringChannels()
	if err != nil {
		return nil, err
	}
	channelIDs := make([]int, 0, len(channels))
	for _, channel := range channels {
		channelIDs = append(channelIDs, channel.Id)
	}
	checks, err := model.ListChannelHealthChecksSince(channelIDs, now.Add(-serviceMonitoringHistoryHours*time.Hour).Unix())
	if err != nil {
		return nil, err
	}

	checksByChannelID := make(map[int][]model.ChannelHealthCheck)
	for _, check := range checks {
		checksByChannelID[check.ChannelID] = append(checksByChannelID[check.ChannelID], check)
	}
	monitors := make([]Monitor, 0, len(channels))
	for _, channel := range channels {
		monitor := Monitor{
			Name:    channel.Name,
			Group:   channel.Group,
			Status:  -1,
			History: make([]uptimeHistoryPoint, 0),
		}
		channelChecks := checksByChannelID[channel.Id]
		upCount := 0
		for _, check := range channelChecks {
			monitor.History = append(monitor.History, uptimeHistoryPoint{
				Timestamp:    check.CheckedAt,
				Status:       check.Status,
				ResponseTime: float64(check.ResponseTime),
			})
			if check.Status != 0 {
				upCount++
			}
		}
		if len(channelChecks) > 0 {
			latest := channelChecks[len(channelChecks)-1]
			monitor.Status = latest.Status
			monitor.ResponseTime = float64(latest.ResponseTime)
			monitor.TokensPerSecond = latest.TokensPerSecond
			monitor.MaxConcurrency = latest.MaxConcurrency
			monitor.Uptime = float64(upCount) / float64(len(channelChecks))
		}
		monitors = append(monitors, monitor)
	}
	sort.Slice(monitors, func(i, j int) bool {
		return monitors[i].Name < monitors[j].Name
	})
	return []UptimeGroupResult{{Monitors: monitors}}, nil
}

func GetServiceMonitoringStatus(c *gin.Context) {
	results, err := getNativeServiceMonitoring(time.Now())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": results})
}
