package controller

import (
	"sort"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const (
	vllmMonitoringHistoryHours = 24
	vllmMonitoringStaleAfter   = 45 * time.Second
)

type vllmMonitoringMetrics struct {
	Instances             int     `json:"instances"`
	RunningRequests       int     `json:"running_requests"`
	WaitingRequests       int     `json:"waiting_requests"`
	OutputTokensPerSecond float64 `json:"output_tokens_per_second"`
	DecodeTokensPerSecond float64 `json:"decode_tokens_per_second"`
	TTFTMilliseconds      float64 `json:"ttft_milliseconds"`
	KVCacheUsagePercent   float64 `json:"kv_cache_usage_percent"`
	PrefixCacheHitRate    float64 `json:"prefix_cache_hit_rate"`
	KVCacheMaxConcurrency float64 `json:"kv_cache_max_concurrency"`
}

type vllmMonitoringInstance struct {
	ChannelID             int      `json:"channel_id"`
	ChannelName           string   `json:"channel_name"`
	Group                 string   `json:"group"`
	Models                string   `json:"models"`
	Endpoint              string   `json:"endpoint"`
	RunningRequests       int      `json:"running_requests"`
	WaitingRequests       int      `json:"waiting_requests"`
	OutputTokensPerSecond *float64 `json:"output_tokens_per_second,omitempty"`
	DecodeTokensPerSecond *float64 `json:"decode_tokens_per_second,omitempty"`
	TTFTMilliseconds      *float64 `json:"ttft_milliseconds,omitempty"`
	KVCacheUsagePercent   *float64 `json:"kv_cache_usage_percent,omitempty"`
	PrefixCacheHitRate    *float64 `json:"prefix_cache_hit_rate,omitempty"`
	KVCacheMaxConcurrency *float64 `json:"kv_cache_max_concurrency,omitempty"`
	CollectedAt           int64    `json:"collected_at"`
}

type vllmMonitoringHistoryPoint struct {
	Timestamp             int64   `json:"timestamp"`
	RunningRequests       float64 `json:"running_requests"`
	WaitingRequests       int     `json:"waiting_requests"`
	OutputTokensPerSecond float64 `json:"output_tokens_per_second"`
	DecodeTokensPerSecond float64 `json:"decode_tokens_per_second"`
	TTFTMilliseconds      float64 `json:"ttft_milliseconds"`
	KVCacheUsagePercent   float64 `json:"kv_cache_usage_percent"`
	PrefixCacheHitRate    float64 `json:"prefix_cache_hit_rate"`
	KVCacheMaxConcurrency float64 `json:"kv_cache_max_concurrency"`
}

type vllmMonitoringHistoryAccumulator struct {
	Point                      vllmMonitoringHistoryPoint
	DecodeTokensPerSecondTotal float64
	DecodeTokensPerSecondCount int
	TTFTMillisecondsTotal      float64
	TTFTMillisecondsCount      int
	KVCacheUsagePercentTotal   float64
	KVCacheUsagePercentCount   int
	PrefixCacheHitRateTotal    float64
	PrefixCacheHitRateCount    int
	KVCacheMaxConcurrencyTotal float64
	KVCacheMaxConcurrencyCount int
}

type vllmMonitoringSummary struct {
	UpdatedAt int64                        `json:"updated_at"`
	Metrics   vllmMonitoringMetrics        `json:"metrics"`
	Instances []vllmMonitoringInstance     `json:"instances"`
	History   []vllmMonitoringHistoryPoint `json:"history"`
}

func buildVLLMMonitoringSummary(now time.Time) (vllmMonitoringSummary, error) {
	summary := vllmMonitoringSummary{
		UpdatedAt: now.Unix(),
		Instances: make([]vllmMonitoringInstance, 0),
		History:   make([]vllmMonitoringHistoryPoint, 0),
	}
	if model.DB == nil {
		return summary, nil
	}

	channels := make([]model.Channel, 0)
	if err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error; err != nil {
		return summary, err
	}
	channelIDs := make([]int, 0, len(channels))
	channelsByID := make(map[int]model.Channel, len(channels))
	for _, channel := range channels {
		channelIDs = append(channelIDs, channel.Id)
		channelsByID[channel.Id] = channel
	}

	latestByChannelID, err := model.ListLatestVLLMMetricSamples(channelIDs)
	if err != nil {
		return summary, err
	}
	staleBefore := now.Add(-vllmMonitoringStaleAfter).Unix()
	for channelID, sample := range latestByChannelID {
		if sample.CollectedAt < staleBefore {
			continue
		}
		channel, exists := channelsByID[channelID]
		if !exists {
			continue
		}
		instance := newVLLMMonitoringInstance(channel, sample)
		summary.Instances = append(summary.Instances, instance)
		summary.Metrics.Instances++
		summary.Metrics.RunningRequests += sample.RunningRequests
		summary.Metrics.WaitingRequests += sample.WaitingRequests
		if sample.OutputTokensPerSecond != nil {
			summary.Metrics.OutputTokensPerSecond += *sample.OutputTokensPerSecond
		}
	}
	averageVLLMMonitoringInstanceMetrics(&summary.Metrics, summary.Instances)
	sort.Slice(summary.Instances, func(i, j int) bool {
		return summary.Instances[i].ChannelName < summary.Instances[j].ChannelName
	})

	aggregates, err := model.ListVLLMMetricAggregatesSince(channelIDs, now.Add(-vllmMonitoringHistoryHours*time.Hour).Unix())
	if err != nil {
		return summary, err
	}
	historyByTimestamp := make(map[int64]*vllmMonitoringHistoryAccumulator)
	for _, aggregate := range aggregates {
		if _, exists := channelsByID[aggregate.ChannelID]; !exists || aggregate.SampleCount == 0 {
			continue
		}
		accumulator := historyByTimestamp[aggregate.BucketAt]
		if accumulator == nil {
			accumulator = &vllmMonitoringHistoryAccumulator{
				Point: vllmMonitoringHistoryPoint{Timestamp: aggregate.BucketAt},
			}
			historyByTimestamp[aggregate.BucketAt] = accumulator
		}
		accumulator.Point.RunningRequests += aggregate.AverageRunningRequests
		accumulator.Point.WaitingRequests += aggregate.MaxWaitingRequests
		if aggregate.OutputTokensPerSecondCount > 0 {
			accumulator.Point.OutputTokensPerSecond += aggregate.OutputTokensPerSecondTotal / float64(aggregate.OutputTokensPerSecondCount)
		}
		accumulator.DecodeTokensPerSecondTotal += aggregate.DecodeTokensPerSecondTotal
		accumulator.DecodeTokensPerSecondCount += aggregate.DecodeTokensPerSecondCount
		accumulator.TTFTMillisecondsTotal += aggregate.TTFTMillisecondsTotal
		accumulator.TTFTMillisecondsCount += aggregate.TTFTMillisecondsCount
		accumulator.KVCacheUsagePercentTotal += aggregate.KVCacheUsagePercentTotal
		accumulator.KVCacheUsagePercentCount += aggregate.KVCacheUsagePercentCount
		accumulator.PrefixCacheHitRateTotal += aggregate.PrefixCacheHitRateTotal
		accumulator.PrefixCacheHitRateCount += aggregate.PrefixCacheHitRateCount
		accumulator.KVCacheMaxConcurrencyTotal += aggregate.KVCacheMaxConcurrencyTotal
		accumulator.KVCacheMaxConcurrencyCount += aggregate.KVCacheMaxConcurrencyCount
	}
	for _, accumulator := range historyByTimestamp {
		point := accumulator.Point
		if accumulator.DecodeTokensPerSecondCount > 0 {
			point.DecodeTokensPerSecond = accumulator.DecodeTokensPerSecondTotal / float64(accumulator.DecodeTokensPerSecondCount)
		}
		if accumulator.TTFTMillisecondsCount > 0 {
			point.TTFTMilliseconds = accumulator.TTFTMillisecondsTotal / float64(accumulator.TTFTMillisecondsCount)
		}
		if accumulator.KVCacheUsagePercentCount > 0 {
			point.KVCacheUsagePercent = accumulator.KVCacheUsagePercentTotal / float64(accumulator.KVCacheUsagePercentCount)
		}
		if accumulator.PrefixCacheHitRateCount > 0 {
			point.PrefixCacheHitRate = accumulator.PrefixCacheHitRateTotal / float64(accumulator.PrefixCacheHitRateCount)
		}
		if accumulator.KVCacheMaxConcurrencyCount > 0 {
			point.KVCacheMaxConcurrency = accumulator.KVCacheMaxConcurrencyTotal / float64(accumulator.KVCacheMaxConcurrencyCount)
		}
		summary.History = append(summary.History, point)
	}
	sort.Slice(summary.History, func(i, j int) bool {
		return summary.History[i].Timestamp < summary.History[j].Timestamp
	})
	return summary, nil
}

func newVLLMMonitoringInstance(channel model.Channel, sample model.VLLMMetricSample) vllmMonitoringInstance {
	return vllmMonitoringInstance{
		ChannelID:             channel.Id,
		ChannelName:           channel.Name,
		Group:                 channel.Group,
		Models:                channel.Models,
		Endpoint:              sample.Endpoint,
		RunningRequests:       sample.RunningRequests,
		WaitingRequests:       sample.WaitingRequests,
		OutputTokensPerSecond: sample.OutputTokensPerSecond,
		DecodeTokensPerSecond: sample.DecodeTokensPerSecond,
		TTFTMilliseconds:      sample.TTFTMilliseconds,
		KVCacheUsagePercent:   sample.KVCacheUsagePercent,
		PrefixCacheHitRate:    sample.PrefixCacheHitRate,
		KVCacheMaxConcurrency: sample.KVCacheMaxConcurrency,
		CollectedAt:           sample.CollectedAt,
	}
}

func averageVLLMMonitoringInstanceMetrics(metrics *vllmMonitoringMetrics, instances []vllmMonitoringInstance) {
	var decodeCount, ttftCount, cacheUsageCount, cacheHitRateCount, capacityCount int
	for _, instance := range instances {
		if instance.DecodeTokensPerSecond != nil {
			metrics.DecodeTokensPerSecond += *instance.DecodeTokensPerSecond
			decodeCount++
		}
		if instance.TTFTMilliseconds != nil {
			metrics.TTFTMilliseconds += *instance.TTFTMilliseconds
			ttftCount++
		}
		if instance.KVCacheUsagePercent != nil {
			metrics.KVCacheUsagePercent += *instance.KVCacheUsagePercent
			cacheUsageCount++
		}
		if instance.PrefixCacheHitRate != nil {
			metrics.PrefixCacheHitRate += *instance.PrefixCacheHitRate
			cacheHitRateCount++
		}
		if instance.KVCacheMaxConcurrency != nil {
			metrics.KVCacheMaxConcurrency += *instance.KVCacheMaxConcurrency
			capacityCount++
		}
	}
	if decodeCount > 0 {
		metrics.DecodeTokensPerSecond /= float64(decodeCount)
	}
	if ttftCount > 0 {
		metrics.TTFTMilliseconds /= float64(ttftCount)
	}
	if cacheUsageCount > 0 {
		metrics.KVCacheUsagePercent /= float64(cacheUsageCount)
	}
	if cacheHitRateCount > 0 {
		metrics.PrefixCacheHitRate /= float64(cacheHitRateCount)
	}
	if capacityCount > 0 {
		metrics.KVCacheMaxConcurrency /= float64(capacityCount)
	}
}
