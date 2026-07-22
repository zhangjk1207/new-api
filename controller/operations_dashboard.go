package controller

import (
	"math"
	"net/http"
	"sort"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

const (
	operationsDashboardHistoryHours = 24
	operationsDashboardRecentWindow = 15 * time.Minute
	operationsDashboardSlowLatency  = 1000
)

type operationsDashboardMetrics struct {
	ActiveUsers     int64   `json:"active_users"`
	EnabledChannels int64   `json:"enabled_channels"`
	HealthyChannels int64   `json:"healthy_channels"`
	ActiveModels    int64   `json:"active_models"`
	TokensPerSecond float64 `json:"tokens_per_second"`
	MaxConcurrency  int     `json:"max_concurrency"`
	SuccessRate15m  float64 `json:"success_rate_15m"`
	P95LatencyMs    float64 `json:"p95_latency_ms"`
}

type operationsDashboardTrafficPoint struct {
	Timestamp    int64   `json:"timestamp"`
	RequestCount int64   `json:"request_count"`
	AvgLatencyMs float64 `json:"avg_latency_ms"`
	SuccessRate  float64 `json:"success_rate"`
}

type operationsDashboardModel struct {
	Name            string  `json:"name"`
	RequestCount    int64   `json:"request_count"`
	SuccessRate     float64 `json:"success_rate"`
	AvgLatencyMs    float64 `json:"avg_latency_ms"`
	TokensPerSecond float64 `json:"tokens_per_second"`
}

type operationsDashboardAlert struct {
	Type  string `json:"type"`
	Name  string `json:"name"`
	Value int64  `json:"value,omitempty"`
}

type operationsDashboardSummary struct {
	UpdatedAt int64                             `json:"updated_at"`
	Metrics   operationsDashboardMetrics        `json:"metrics"`
	Traffic   []operationsDashboardTrafficPoint `json:"traffic"`
	Models    []operationsDashboardModel        `json:"models"`
	Alerts    []operationsDashboardAlert        `json:"alerts"`
}

func buildOperationsDashboardSummary(now time.Time) (operationsDashboardSummary, error) {
	summary := operationsDashboardSummary{
		UpdatedAt: now.Unix(),
		Traffic:   make([]operationsDashboardTrafficPoint, 0),
		Models:    make([]operationsDashboardModel, 0),
		Alerts:    make([]operationsDashboardAlert, 0),
	}
	if model.DB == nil {
		return summary, nil
	}

	start := now.Add(-operationsDashboardHistoryHours * time.Hour)
	var channels []model.Channel
	if err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error; err != nil {
		return summary, err
	}
	summary.Metrics.EnabledChannels = int64(len(channels))

	if err := model.DB.Model(&model.QuotaData{}).
		Where("created_at >= ? AND created_at <= ?", start.Unix(), now.Unix()).
		Distinct("user_id").
		Count(&summary.Metrics.ActiveUsers).Error; err != nil {
		return summary, err
	}

	channelIDs := make([]int, 0, len(channels))
	for _, channel := range channels {
		channelIDs = append(channelIDs, channel.Id)
	}
	checks, err := model.ListChannelHealthChecksSince(channelIDs, start.Unix())
	if err != nil {
		return summary, err
	}

	latestByChannelID := make(map[int]model.ChannelHealthCheck, len(channels))
	recentSuccessCount := int64(0)
	recentCheckCount := int64(0)
	recentLatencies := make([]int, 0)
	recentStart := now.Add(-operationsDashboardRecentWindow).Unix()
	for _, check := range checks {
		latestByChannelID[check.ChannelID] = check
		if check.CheckedAt < recentStart {
			continue
		}
		recentCheckCount++
		if check.Status == 1 {
			recentSuccessCount++
		}
		if check.ResponseTime > 0 {
			recentLatencies = append(recentLatencies, check.ResponseTime)
		}
	}
	if recentCheckCount > 0 {
		summary.Metrics.SuccessRate15m = float64(recentSuccessCount) / float64(recentCheckCount) * 100
	}
	summary.Metrics.P95LatencyMs = operationsDashboardPercentile(recentLatencies, 0.95)

	for _, channel := range channels {
		latest, ok := latestByChannelID[channel.Id]
		if !ok {
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "channel_no_data", Name: channel.Name})
			continue
		}
		if latest.Status != 0 {
			summary.Metrics.HealthyChannels++
		} else {
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "channel_down", Name: channel.Name})
		}
		if latest.TokensPerSecond != nil {
			summary.Metrics.TokensPerSecond += *latest.TokensPerSecond
		}
		if latest.MaxConcurrency != nil {
			summary.Metrics.MaxConcurrency += *latest.MaxConcurrency
		}
		if latest.ResponseTime >= operationsDashboardSlowLatency {
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "channel_slow", Name: channel.Name, Value: int64(latest.ResponseTime)})
		}
	}

	performance, err := model.GetPerfMetricsSummaryAll(start.Unix(), now.Unix(), nil)
	if err != nil {
		return summary, err
	}
	quotaModels := make([]string, 0)
	if err = model.DB.Model(&model.QuotaData{}).
		Where("created_at >= ? AND created_at <= ? AND model_name <> ?", start.Unix(), now.Unix(), "").
		Distinct("model_name").
		Pluck("model_name", &quotaModels).Error; err != nil {
		return summary, err
	}
	activeModels := make(map[string]struct{}, len(performance)+len(quotaModels))
	for _, name := range quotaModels {
		activeModels[name] = struct{}{}
	}
	for _, item := range performance {
		activeModels[item.ModelName] = struct{}{}
		modelSummary := operationsDashboardModel{
			Name:         item.ModelName,
			RequestCount: item.RequestCount,
		}
		if item.RequestCount > 0 {
			modelSummary.SuccessRate = float64(item.SuccessCount) / float64(item.RequestCount) * 100
			modelSummary.AvgLatencyMs = float64(item.TotalLatencyMs) / float64(item.RequestCount)
		}
		if item.GenerationMs > 0 {
			modelSummary.TokensPerSecond = float64(item.OutputTokens) / float64(item.GenerationMs) * 1000
		}
		summary.Models = append(summary.Models, modelSummary)
		if item.RequestCount >= 10 && modelSummary.SuccessRate < 95 {
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "model_low_success", Name: item.ModelName, Value: int64(math.Round(modelSummary.SuccessRate))})
		}
	}
	summary.Metrics.ActiveModels = int64(len(activeModels))
	sort.Slice(summary.Models, func(i, j int) bool {
		if summary.Models[i].TokensPerSecond == summary.Models[j].TokensPerSecond {
			return summary.Models[i].RequestCount > summary.Models[j].RequestCount
		}
		return summary.Models[i].TokensPerSecond > summary.Models[j].TokensPerSecond
	})
	if len(summary.Models) > 8 {
		summary.Models = summary.Models[:8]
	}

	buckets, err := model.GetPerfMetricsSummaryBucketsAll(start.Unix(), now.Unix(), nil)
	if err != nil {
		return summary, err
	}
	totalsByTimestamp := make(map[int64]model.PerfMetricSummary, len(buckets))
	for _, bucket := range buckets {
		total := totalsByTimestamp[bucket.BucketTs]
		total.RequestCount += bucket.RequestCount
		total.SuccessCount += bucket.SuccessCount
		total.TotalLatencyMs += bucket.TotalLatencyMs
		totalsByTimestamp[bucket.BucketTs] = total
	}
	for timestamp, total := range totalsByTimestamp {
		point := operationsDashboardTrafficPoint{
			Timestamp:    timestamp,
			RequestCount: total.RequestCount,
		}
		if total.RequestCount > 0 {
			point.SuccessRate = float64(total.SuccessCount) / float64(total.RequestCount) * 100
			point.AvgLatencyMs = float64(total.TotalLatencyMs) / float64(total.RequestCount)
		}
		summary.Traffic = append(summary.Traffic, point)
	}
	sort.Slice(summary.Traffic, func(i, j int) bool {
		return summary.Traffic[i].Timestamp < summary.Traffic[j].Timestamp
	})
	sort.SliceStable(summary.Alerts, func(i, j int) bool {
		return summary.Alerts[i].Type < summary.Alerts[j].Type
	})

	return summary, nil
}

func operationsDashboardPercentile(values []int, percentile float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sort.Ints(values)
	position := int(math.Ceil(float64(len(values))*percentile)) - 1
	return float64(values[position])
}

func GetOperationsDashboardSummary(c *gin.Context) {
	summary, err := buildOperationsDashboardSummary(time.Now())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": summary})
}
