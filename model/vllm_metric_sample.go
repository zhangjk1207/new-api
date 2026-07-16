package model

import "gorm.io/gorm"

type VLLMMetricSample struct {
	Id                       int64    `json:"id" gorm:"primaryKey"`
	ChannelID                int      `json:"channel_id" gorm:"not null;index:idx_vllm_metric_channel_collected,priority:1"`
	Endpoint                 string   `json:"endpoint" gorm:"type:varchar(512);not null"`
	RunningRequests          int      `json:"running_requests" gorm:"not null"`
	WaitingRequests          int      `json:"waiting_requests" gorm:"not null"`
	GenerationTokensTotal    float64  `json:"generation_tokens_total" gorm:"not null"`
	TTFTCount                float64  `json:"ttft_count" gorm:"not null"`
	TTFTSumSeconds           float64  `json:"ttft_sum_seconds" gorm:"not null"`
	InterTokenLatencyCount   float64  `json:"inter_token_latency_count" gorm:"not null"`
	InterTokenLatencySeconds float64  `json:"inter_token_latency_seconds" gorm:"not null"`
	PrefixCacheQueriesTotal  float64  `json:"prefix_cache_queries_total" gorm:"not null"`
	PrefixCacheHitsTotal     float64  `json:"prefix_cache_hits_total" gorm:"not null"`
	OutputTokensPerSecond    *float64 `json:"output_tokens_per_second,omitempty"`
	DecodeTokensPerSecond    *float64 `json:"decode_tokens_per_second,omitempty"`
	TTFTMilliseconds         *float64 `json:"ttft_milliseconds,omitempty"`
	KVCacheUsagePercent      *float64 `json:"kv_cache_usage_percent,omitempty"`
	PrefixCacheHitRate       *float64 `json:"prefix_cache_hit_rate,omitempty"`
	KVCacheMaxConcurrency    *float64 `json:"kv_cache_max_concurrency,omitempty"`
	CollectedAt              int64    `json:"collected_at" gorm:"not null;index:idx_vllm_metric_channel_collected,priority:2"`
}

func (VLLMMetricSample) TableName() string {
	return "vllm_metric_samples"
}

type VLLMMetricAggregate struct {
	Id                         int64   `json:"id" gorm:"primaryKey"`
	ChannelID                  int     `json:"channel_id" gorm:"not null;uniqueIndex:idx_vllm_metric_aggregate_bucket,priority:1"`
	Endpoint                   string  `json:"endpoint" gorm:"type:varchar(512);not null"`
	BucketAt                   int64   `json:"bucket_at" gorm:"not null;uniqueIndex:idx_vllm_metric_aggregate_bucket,priority:2"`
	SampleCount                int     `json:"sample_count" gorm:"not null"`
	AverageRunningRequests     float64 `json:"average_running_requests" gorm:"not null"`
	MaxWaitingRequests         int     `json:"max_waiting_requests" gorm:"not null"`
	OutputTokensPerSecondTotal float64 `json:"output_tokens_per_second_total" gorm:"not null"`
	OutputTokensPerSecondCount int     `json:"output_tokens_per_second_count" gorm:"not null"`
	DecodeTokensPerSecondTotal float64 `json:"decode_tokens_per_second_total" gorm:"not null"`
	DecodeTokensPerSecondCount int     `json:"decode_tokens_per_second_count" gorm:"not null"`
	TTFTMillisecondsTotal      float64 `json:"ttft_milliseconds_total" gorm:"not null"`
	TTFTMillisecondsCount      int     `json:"ttft_milliseconds_count" gorm:"not null"`
	KVCacheUsagePercentTotal   float64 `json:"kv_cache_usage_percent_total" gorm:"not null"`
	KVCacheUsagePercentCount   int     `json:"kv_cache_usage_percent_count" gorm:"not null"`
	PrefixCacheHitRateTotal    float64 `json:"prefix_cache_hit_rate_total" gorm:"not null"`
	PrefixCacheHitRateCount    int     `json:"prefix_cache_hit_rate_count" gorm:"not null"`
	KVCacheMaxConcurrencyTotal float64 `json:"kv_cache_max_concurrency_total" gorm:"not null"`
	KVCacheMaxConcurrencyCount int     `json:"kv_cache_max_concurrency_count" gorm:"not null"`
}

func (VLLMMetricAggregate) TableName() string {
	return "vllm_metric_aggregates"
}

func CreateVLLMMetricSample(sample *VLLMMetricSample) error {
	return DB.Create(sample).Error
}

func GetLatestVLLMMetricSample(channelID int) (*VLLMMetricSample, error) {
	var sample VLLMMetricSample
	result := DB.Where("channel_id = ?", channelID).Order("collected_at DESC").Limit(1).Find(&sample)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &sample, nil
}

func ListVLLMMetricSamplesSince(channelIDs []int, since int64) ([]VLLMMetricSample, error) {
	samples := make([]VLLMMetricSample, 0)
	if len(channelIDs) == 0 {
		return samples, nil
	}
	err := DB.Where("channel_id IN ? AND collected_at >= ?", channelIDs, since).
		Order("collected_at ASC").
		Find(&samples).Error
	return samples, err
}

func ListLatestVLLMMetricSamples(channelIDs []int) (map[int]VLLMMetricSample, error) {
	latestByChannelID := make(map[int]VLLMMetricSample, len(channelIDs))
	if len(channelIDs) == 0 {
		return latestByChannelID, nil
	}
	samples := make([]VLLMMetricSample, 0)
	if err := DB.Where("channel_id IN ?", channelIDs).
		Order("collected_at DESC").
		Find(&samples).Error; err != nil {
		return nil, err
	}
	for _, sample := range samples {
		if _, exists := latestByChannelID[sample.ChannelID]; !exists {
			latestByChannelID[sample.ChannelID] = sample
		}
	}
	return latestByChannelID, nil
}

func ListVLLMMetricAggregatesSince(channelIDs []int, since int64) ([]VLLMMetricAggregate, error) {
	aggregates := make([]VLLMMetricAggregate, 0)
	if len(channelIDs) == 0 {
		return aggregates, nil
	}
	err := DB.Where("channel_id IN ? AND bucket_at >= ?", channelIDs, since).
		Order("bucket_at ASC").
		Find(&aggregates).Error
	return aggregates, err
}

func CreateOrUpdateVLLMMetricAggregate(sample VLLMMetricSample) error {
	bucketAt := sample.CollectedAt / 300 * 300
	return DB.Transaction(func(tx *gorm.DB) error {
		aggregate := VLLMMetricAggregate{
			ChannelID: sample.ChannelID,
			Endpoint:  sample.Endpoint,
			BucketAt:  bucketAt,
		}
		if err := tx.Where(&VLLMMetricAggregate{ChannelID: sample.ChannelID, BucketAt: bucketAt}).FirstOrCreate(&aggregate).Error; err != nil {
			return err
		}
		aggregate.SampleCount++
		aggregate.AverageRunningRequests += (float64(sample.RunningRequests) - aggregate.AverageRunningRequests) / float64(aggregate.SampleCount)
		if sample.WaitingRequests > aggregate.MaxWaitingRequests {
			aggregate.MaxWaitingRequests = sample.WaitingRequests
		}
		addVLLMMetricAggregateValue(sample.OutputTokensPerSecond, &aggregate.OutputTokensPerSecondTotal, &aggregate.OutputTokensPerSecondCount)
		addVLLMMetricAggregateValue(sample.DecodeTokensPerSecond, &aggregate.DecodeTokensPerSecondTotal, &aggregate.DecodeTokensPerSecondCount)
		addVLLMMetricAggregateValue(sample.TTFTMilliseconds, &aggregate.TTFTMillisecondsTotal, &aggregate.TTFTMillisecondsCount)
		addVLLMMetricAggregateValue(sample.KVCacheUsagePercent, &aggregate.KVCacheUsagePercentTotal, &aggregate.KVCacheUsagePercentCount)
		addVLLMMetricAggregateValue(sample.PrefixCacheHitRate, &aggregate.PrefixCacheHitRateTotal, &aggregate.PrefixCacheHitRateCount)
		addVLLMMetricAggregateValue(sample.KVCacheMaxConcurrency, &aggregate.KVCacheMaxConcurrencyTotal, &aggregate.KVCacheMaxConcurrencyCount)
		return tx.Save(&aggregate).Error
	})
}

func addVLLMMetricAggregateValue(value *float64, total *float64, count *int) {
	if value == nil {
		return
	}
	*total += *value
	*count++
}

func DeleteVLLMMetricSamplesBefore(timestamp int64) error {
	return DB.Where("collected_at < ?", timestamp).Delete(&VLLMMetricSample{}).Error
}

func DeleteVLLMMetricAggregatesBefore(timestamp int64) error {
	return DB.Where("bucket_at < ?", timestamp).Delete(&VLLMMetricAggregate{}).Error
}
