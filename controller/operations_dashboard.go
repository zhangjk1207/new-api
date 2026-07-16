package controller

import (
	"math"
	"net/http"
	"sort"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	perfmetrics "github.com/QuantumNous/new-api/pkg/perf_metrics"

	"github.com/gin-gonic/gin"
)

const (
	operationsDashboardHistoryHours = 24
	operationsDashboardRecentWindow = 15 * time.Minute
	operationsDashboardSlowLatency  = 1000
)

type operationsDashboardMetrics struct {
	ActiveUsers                     int64   `json:"active_users"`
	EnabledChannels                 int64   `json:"enabled_channels"`
	HealthyChannels                 int64   `json:"healthy_channels"`
	UnavailableChannels             int64   `json:"unavailable_channels"`
	ChannelsWithoutRecentHealthData int64   `json:"channels_without_recent_health_data"`
	SlowChannels                    int64   `json:"slow_channels"`
	ActiveModels                    int64   `json:"active_models"`
	Requests24h                     int64   `json:"requests_24h"`
	TotalTokens24h                  int64   `json:"total_tokens_24h"`
	GatewaySuccessRate15m           float64 `json:"gateway_success_rate_15m"`
	GatewayAverageLatencyMs15m      float64 `json:"gateway_average_latency_ms_15m"`
	GatewayP95LatencyMs15m          float64 `json:"gateway_p95_latency_ms_15m"`
	GatewayCalls15m                 int64   `json:"gateway_calls_15m"`
}

type operationsDashboardTrafficPoint struct {
	Timestamp          int64   `json:"timestamp"`
	RequestCount       int64   `json:"request_count"`
	SuccessfulRequests int64   `json:"successful_requests"`
	FailedRequests     int64   `json:"failed_requests"`
	TotalTokens        int64   `json:"total_tokens"`
	AvgLatencyMs       float64 `json:"avg_latency_ms"`
	SuccessRate        float64 `json:"success_rate"`
}

type operationsDashboardModel struct {
	Name                  string  `json:"name"`
	RequestCount          int64   `json:"request_count"`
	TokenUsed             int64   `json:"token_used"`
	SuccessRate           float64 `json:"success_rate"`
	AvgLatencyMs          float64 `json:"avg_latency_ms"`
	OutputTokensPerSecond float64 `json:"output_tokens_per_second"`
}

type operationsDashboardUser struct {
	Name         string `json:"name"`
	RequestCount int64  `json:"request_count"`
	TokenUsed    int64  `json:"token_used"`
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
	Users     []operationsDashboardUser         `json:"users"`
	Alerts    []operationsDashboardAlert        `json:"alerts"`
}

func buildOperationsDashboardSummary(now time.Time) (operationsDashboardSummary, error) {
	summary := operationsDashboardSummary{
		UpdatedAt: now.Unix(),
		Metrics: operationsDashboardMetrics{
			GatewaySuccessRate15m: 100,
		},
		Traffic: make([]operationsDashboardTrafficPoint, 0),
		Models:  make([]operationsDashboardModel, 0),
		Users:   make([]operationsDashboardUser, 0),
		Alerts:  make([]operationsDashboardAlert, 0),
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

	channelIDs := make([]int, 0, len(channels))
	for _, channel := range channels {
		channelIDs = append(channelIDs, channel.Id)
	}
	checks, err := model.ListChannelHealthChecksSince(channelIDs, start.Unix())
	if err != nil {
		return summary, err
	}

	latestByChannelID := make(map[int]model.ChannelHealthCheck, len(channels))
	for _, check := range checks {
		latestByChannelID[check.ChannelID] = check
	}

	healthDataDeadline := now.Add(-3 * time.Minute).Unix()
	for _, channel := range channels {
		latest, ok := latestByChannelID[channel.Id]
		if !ok || latest.CheckedAt < healthDataDeadline {
			summary.Metrics.ChannelsWithoutRecentHealthData++
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "channel_no_data", Name: channel.Name})
			continue
		}
		if latest.Status == 1 {
			summary.Metrics.HealthyChannels++
		} else {
			summary.Metrics.UnavailableChannels++
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "channel_down", Name: channel.Name})
			continue
		}
		if latest.ResponseTime >= operationsDashboardSlowLatency {
			summary.Metrics.SlowChannels++
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "channel_slow", Name: channel.Name, Value: int64(latest.ResponseTime)})
		}
	}

	performance, err := model.GetPerfMetricsSummaryAll(start.Unix(), now.Unix(), nil)
	if err != nil {
		return summary, err
	}
	modelsByName := make(map[string]*operationsDashboardModel, len(performance))
	for _, item := range performance {
		modelSummary := &operationsDashboardModel{
			Name:         item.ModelName,
			RequestCount: item.RequestCount,
		}
		if item.RequestCount > 0 {
			modelSummary.SuccessRate = float64(item.SuccessCount) / float64(item.RequestCount) * 100
			modelSummary.AvgLatencyMs = float64(item.TotalLatencyMs) / float64(item.RequestCount)
		}
		if item.GenerationMs > 0 {
			modelSummary.OutputTokensPerSecond = float64(item.OutputTokens) / float64(item.GenerationMs) * 1000
		}
		modelsByName[item.ModelName] = modelSummary
		summary.Metrics.Requests24h += item.RequestCount
		if item.RequestCount >= 10 && modelSummary.SuccessRate < 95 {
			summary.Alerts = append(summary.Alerts, operationsDashboardAlert{Type: "model_low_success", Name: item.ModelName, Value: int64(math.Round(modelSummary.SuccessRate))})
		}
	}

	tokenStats, err := model.GetUserModelTokenStats(model.UserModelTokenStatsFilter{
		StartTime: start.Unix(),
		EndTime:   now.Unix(),
	})
	if err != nil {
		return summary, err
	}
	tokenTotalsByHour := make(map[int64]int64)
	usersByName := make(map[string]*operationsDashboardUser)
	for _, stat := range tokenStats {
		if stat.Username != "" {
			user := usersByName[stat.Username]
			if user == nil {
				user = &operationsDashboardUser{Name: stat.Username}
				usersByName[stat.Username] = user
			}
			user.RequestCount += int64(stat.Count)
			user.TokenUsed += int64(stat.TokenUsed)
		}
		modelSummary := modelsByName[stat.ModelName]
		if modelSummary == nil {
			modelSummary = &operationsDashboardModel{Name: stat.ModelName}
			modelsByName[stat.ModelName] = modelSummary
		}
		modelSummary.TokenUsed += int64(stat.TokenUsed)
		summary.Metrics.TotalTokens24h += int64(stat.TokenUsed)
		tokenTotalsByHour[stat.CreatedAt] += int64(stat.TokenUsed)
	}
	summary.Metrics.ActiveUsers = int64(len(usersByName))
	summary.Metrics.ActiveModels = int64(len(modelsByName))
	for _, user := range usersByName {
		summary.Users = append(summary.Users, *user)
	}
	for _, modelSummary := range modelsByName {
		summary.Models = append(summary.Models, *modelSummary)
	}
	sort.Slice(summary.Users, func(i, j int) bool {
		if summary.Users[i].TokenUsed == summary.Users[j].TokenUsed {
			return summary.Users[i].RequestCount > summary.Users[j].RequestCount
		}
		return summary.Users[i].TokenUsed > summary.Users[j].TokenUsed
	})
	if len(summary.Users) > 5 {
		summary.Users = summary.Users[:5]
	}
	sort.Slice(summary.Models, func(i, j int) bool {
		if summary.Models[i].TokenUsed == summary.Models[j].TokenUsed {
			return summary.Models[i].RequestCount > summary.Models[j].RequestCount
		}
		return summary.Models[i].TokenUsed > summary.Models[j].TokenUsed
	})
	if len(summary.Models) > 5 {
		summary.Models = summary.Models[:5]
	}

	recentLogs := make([]model.Log, 0)
	recentStart := now.Add(-operationsDashboardRecentWindow).Unix()
	if err = model.LOG_DB.Model(&model.Log{}).
		Select("type, use_time").
		Where("created_at >= ? AND created_at <= ? AND type IN ?", recentStart, now.Unix(), []int{model.LogTypeConsume, model.LogTypeError}).
		Find(&recentLogs).Error; err != nil {
		return summary, err
	}
	latencies := make([]int, 0, len(recentLogs))
	successfulGatewayCalls := int64(0)
	for _, log := range recentLogs {
		summary.Metrics.GatewayCalls15m++
		if log.Type == model.LogTypeConsume {
			successfulGatewayCalls++
		}
		latencies = append(latencies, log.UseTime*1000)
	}
	if summary.Metrics.GatewayCalls15m > 0 {
		summary.Metrics.GatewaySuccessRate15m = float64(successfulGatewayCalls) / float64(summary.Metrics.GatewayCalls15m) * 100
		for _, latency := range latencies {
			summary.Metrics.GatewayAverageLatencyMs15m += float64(latency)
		}
		summary.Metrics.GatewayAverageLatencyMs15m /= float64(summary.Metrics.GatewayCalls15m)
		summary.Metrics.GatewayP95LatencyMs15m = operationsDashboardPercentile(latencies, 0.95)
	}

	traffic, err := perfmetrics.QueryTrafficSummaryAllAt(operationsDashboardHistoryHours, nil, now)
	if err != nil {
		return summary, err
	}
	for _, trafficPoint := range traffic {
		successRate := 100.0
		if trafficPoint.RequestCount > 0 {
			successRate = trafficPoint.SuccessRate
		}
		point := operationsDashboardTrafficPoint{
			Timestamp:          trafficPoint.Timestamp,
			RequestCount:       trafficPoint.RequestCount,
			SuccessfulRequests: int64(math.Round(float64(trafficPoint.RequestCount) * successRate / 100)),
			TotalTokens:        tokenTotalsByHour[trafficPoint.Timestamp],
			AvgLatencyMs:       trafficPoint.AvgLatencyMs,
			SuccessRate:        successRate,
		}
		point.FailedRequests = point.RequestCount - point.SuccessfulRequests
		summary.Traffic = append(summary.Traffic, point)
	}
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
