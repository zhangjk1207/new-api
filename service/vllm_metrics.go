package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	clientmodel "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
)

const (
	vllmMetricCollectionInterval = 15 * time.Second
	vllmMetricRequestTimeout     = 5 * time.Second
	vllmMetricSampleRetention    = 7 * 24 * time.Hour
	vllmMetricAggregateRetention = 90 * 24 * time.Hour
)

type vllmMetricSnapshot struct {
	RunningRequests          int
	WaitingRequests          int
	GenerationTokensTotal    float64
	TTFTCount                float64
	TTFTSumSeconds           float64
	InterTokenLatencyCount   float64
	InterTokenLatencySeconds float64
	PrefixCacheQueriesTotal  float64
	PrefixCacheHitsTotal     float64
	KVCacheUsagePercent      *float64
	KVCacheMaxConcurrency    *float64
	HasCacheConfig           bool
}

var (
	vllmMetricCollectionInProgress atomic.Bool
	vllmMetricDatabaseMu           sync.Mutex
)

func InitVLLMMetrics() {
	if !common.IsMasterNode {
		return
	}
	go func() {
		RunVLLMMetricCollection(context.Background())
		ticker := time.NewTicker(vllmMetricCollectionInterval)
		defer ticker.Stop()
		for range ticker.C {
			RunVLLMMetricCollection(context.Background())
		}
	}()
}

func RunVLLMMetricCollection(ctx context.Context) {
	if !vllmMetricCollectionInProgress.CompareAndSwap(false, true) {
		return
	}
	defer vllmMetricCollectionInProgress.Store(false)

	channels := make([]model.Channel, 0)
	if err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error; err != nil {
		common.SysError(fmt.Sprintf("list enabled channels for vLLM metrics failed: %v", err))
		return
	}

	client := &http.Client{Timeout: vllmMetricRequestTimeout}
	now := time.Now()
	var wg sync.WaitGroup
	for _, channel := range channels {
		channel := channel
		if strings.TrimSpace(channel.GetBaseURL()) == "" {
			continue
		}
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, _, err := CollectAndStoreVLLMMetrics(ctx, client, channel, now)
			if err != nil {
				common.SysError(fmt.Sprintf("collect vLLM metrics for channel %d failed: %v", channel.Id, err))
			}
		}()
	}
	wg.Wait()
	if err := model.DeleteVLLMMetricSamplesBefore(now.Add(-vllmMetricSampleRetention).Unix()); err != nil {
		common.SysError(fmt.Sprintf("clean vLLM metric samples failed: %v", err))
	}
	if err := model.DeleteVLLMMetricAggregatesBefore(now.Add(-vllmMetricAggregateRetention).Unix()); err != nil {
		common.SysError(fmt.Sprintf("clean vLLM metric aggregates failed: %v", err))
	}
}

func CollectAndStoreVLLMMetrics(ctx context.Context, client *http.Client, channel model.Channel, now time.Time) (*model.VLLMMetricSample, bool, error) {
	baseURL := strings.TrimSuffix(strings.TrimSpace(channel.GetBaseURL()), "/")
	if baseURL == "" {
		return nil, false, nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/metrics", nil)
	if err != nil {
		return nil, false, nil
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, false, nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, false, nil
	}

	snapshot, recognized, err := parseVLLMMetricSnapshot(resp.Body)
	if err != nil || !recognized {
		return nil, false, nil
	}

	sample := &model.VLLMMetricSample{
		ChannelID:                channel.Id,
		Endpoint:                 baseURL,
		RunningRequests:          snapshot.RunningRequests,
		WaitingRequests:          snapshot.WaitingRequests,
		GenerationTokensTotal:    snapshot.GenerationTokensTotal,
		TTFTCount:                snapshot.TTFTCount,
		TTFTSumSeconds:           snapshot.TTFTSumSeconds,
		InterTokenLatencyCount:   snapshot.InterTokenLatencyCount,
		InterTokenLatencySeconds: snapshot.InterTokenLatencySeconds,
		PrefixCacheQueriesTotal:  snapshot.PrefixCacheQueriesTotal,
		PrefixCacheHitsTotal:     snapshot.PrefixCacheHitsTotal,
		KVCacheUsagePercent:      snapshot.KVCacheUsagePercent,
		KVCacheMaxConcurrency:    snapshot.KVCacheMaxConcurrency,
		CollectedAt:              now.Unix(),
	}
	if snapshot.PrefixCacheQueriesTotal > 0 {
		hitRate := snapshot.PrefixCacheHitsTotal / snapshot.PrefixCacheQueriesTotal * 100
		sample.PrefixCacheHitRate = &hitRate
	}
	vllmMetricDatabaseMu.Lock()
	defer vllmMetricDatabaseMu.Unlock()
	previous, err := model.GetLatestVLLMMetricSample(channel.Id)
	if err != nil {
		return nil, true, err
	}
	if previous != nil {
		deriveVLLMMetricRates(sample, *previous)
	}
	if err := model.CreateVLLMMetricSample(sample); err != nil {
		return nil, true, err
	}
	if err := model.CreateOrUpdateVLLMMetricAggregate(*sample); err != nil {
		return nil, true, err
	}
	return sample, true, nil
}

func deriveVLLMMetricRates(sample *model.VLLMMetricSample, previous model.VLLMMetricSample) {
	duration := float64(sample.CollectedAt - previous.CollectedAt)
	if duration <= 0 {
		return
	}
	if sample.GenerationTokensTotal >= previous.GenerationTokensTotal {
		rate := (sample.GenerationTokensTotal - previous.GenerationTokensTotal) / duration
		sample.OutputTokensPerSecond = &rate
	}
	if sample.InterTokenLatencyCount > previous.InterTokenLatencyCount && sample.InterTokenLatencySeconds >= previous.InterTokenLatencySeconds {
		interval := (sample.InterTokenLatencySeconds - previous.InterTokenLatencySeconds) / (sample.InterTokenLatencyCount - previous.InterTokenLatencyCount)
		if interval > 0 {
			rate := 1 / interval
			sample.DecodeTokensPerSecond = &rate
		}
	}
	if sample.TTFTCount > previous.TTFTCount && sample.TTFTSumSeconds >= previous.TTFTSumSeconds {
		milliseconds := (sample.TTFTSumSeconds - previous.TTFTSumSeconds) / (sample.TTFTCount - previous.TTFTCount) * 1000
		sample.TTFTMilliseconds = &milliseconds
	}
}

func parseVLLMMetricSnapshot(reader io.Reader) (vllmMetricSnapshot, bool, error) {
	decoder := expfmt.NewDecoder(reader, expfmt.FmtText)
	snapshot := vllmMetricSnapshot{}
	recognized := false
	for {
		family := &clientmodel.MetricFamily{}
		err := decoder.Decode(family)
		if errors.Is(err, io.EOF) {
			return snapshot, recognized && snapshot.HasCacheConfig, nil
		}
		if err != nil {
			return vllmMetricSnapshot{}, false, err
		}

		switch family.GetName() {
		case "vllm:num_requests_running":
			recognized = true
			snapshot.RunningRequests = int(metricFamilyValue(family))
		case "vllm:num_requests_waiting":
			recognized = true
			snapshot.WaitingRequests = int(metricFamilyValue(family))
		case "vllm:generation_tokens_total":
			recognized = true
			snapshot.GenerationTokensTotal = metricFamilyValue(family)
		case "vllm:time_to_first_token_seconds_count":
			recognized = true
			snapshot.TTFTCount = metricFamilyValue(family)
		case "vllm:time_to_first_token_seconds_sum":
			recognized = true
			snapshot.TTFTSumSeconds = metricFamilyValue(family)
		case "vllm:time_to_first_token_seconds":
			recognized = true
			for _, metric := range family.Metric {
				snapshot.TTFTCount += float64(metric.GetHistogram().GetSampleCount())
				snapshot.TTFTSumSeconds += metric.GetHistogram().GetSampleSum()
			}
		case "vllm:inter_token_latency_seconds_count":
			recognized = true
			snapshot.InterTokenLatencyCount = metricFamilyValue(family)
		case "vllm:inter_token_latency_seconds_sum":
			recognized = true
			snapshot.InterTokenLatencySeconds = metricFamilyValue(family)
		case "vllm:inter_token_latency_seconds":
			recognized = true
			for _, metric := range family.Metric {
				snapshot.InterTokenLatencyCount += float64(metric.GetHistogram().GetSampleCount())
				snapshot.InterTokenLatencySeconds += metric.GetHistogram().GetSampleSum()
			}
		case "vllm:prefix_cache_queries_total":
			recognized = true
			snapshot.PrefixCacheQueriesTotal = metricFamilyValue(family)
		case "vllm:prefix_cache_hits_total":
			recognized = true
			snapshot.PrefixCacheHitsTotal = metricFamilyValue(family)
		case "vllm:kv_cache_usage_perc":
			recognized = true
			value := metricFamilyValue(family) * 100
			snapshot.KVCacheUsagePercent = &value
		case "vllm:cache_config_info":
			recognized = true
			snapshot.HasCacheConfig = true
			for _, metric := range family.Metric {
				for _, label := range metric.Label {
					if label.GetName() != "kv_cache_max_concurrency" {
						continue
					}
					value, parseErr := strconv.ParseFloat(label.GetValue(), 64)
					if parseErr == nil && value >= 0 {
						snapshot.KVCacheMaxConcurrency = &value
					}
				}
			}
		}
	}
}

func metricFamilyValue(family *clientmodel.MetricFamily) float64 {
	var total float64
	for _, metric := range family.Metric {
		if metric.Gauge != nil {
			total += metric.GetGauge().GetValue()
			continue
		}
		if metric.Counter != nil {
			total += metric.GetCounter().GetValue()
			continue
		}
		if metric.Untyped != nil {
			total += metric.GetUntyped().GetValue()
		}
	}
	return total
}
