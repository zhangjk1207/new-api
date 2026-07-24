package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCollectAndStoreVLLMMetricsDerivesNativeEngineRates(t *testing.T) {
	truncate(t)
	require.NoError(t, model.DB.AutoMigrate(&model.VLLMMetricSample{}, &model.VLLMMetricAggregate{}))
	t.Cleanup(func() {
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricSample{}).Error)
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricAggregate{}).Error)
	})

	var requestCount atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/metrics", r.URL.Path)
		if requestCount.Add(1) == 1 {
			_, _ = w.Write([]byte(vllmMetricsFixture(100, 10, 5, 100, 4, 1, 2, 0.4, 1000, 700)))
			return
		}
		_, _ = w.Write([]byte(vllmMetricsFixture(550, 12, 5.4, 200, 9, 3, 0, 0.6, 1100, 800)))
	}))
	defer server.Close()

	now := time.Date(2026, time.July, 15, 10, 0, 0, 0, time.UTC)
	channel := model.Channel{Id: 1, Name: "vllm", BaseURL: &server.URL}
	first, recognized, err := CollectAndStoreVLLMMetrics(context.Background(), server.Client(), channel, now)

	require.NoError(t, err)
	assert.True(t, recognized)
	require.NotNil(t, first)
	assert.Nil(t, first.OutputTokensPerSecond)
	assert.Nil(t, first.DecodeTokensPerSecond)

	second, recognized, err := CollectAndStoreVLLMMetrics(context.Background(), server.Client(), channel, now.Add(15*time.Second))

	require.NoError(t, err)
	assert.True(t, recognized)
	require.NotNil(t, second)
	assert.Equal(t, 3, second.RunningRequests)
	assert.Equal(t, 0, second.WaitingRequests)
	require.NotNil(t, second.OutputTokensPerSecond)
	assert.InDelta(t, 30, *second.OutputTokensPerSecond, 0.001)
	require.NotNil(t, second.DecodeTokensPerSecond)
	assert.InDelta(t, 20, *second.DecodeTokensPerSecond, 0.001)
	require.NotNil(t, second.TTFTMilliseconds)
	assert.InDelta(t, 200, *second.TTFTMilliseconds, 0.001)
	require.NotNil(t, second.KVCacheUsagePercent)
	assert.InDelta(t, 60, *second.KVCacheUsagePercent, 0.001)
	require.NotNil(t, second.PrefixCacheHitRate)
	assert.InDelta(t, 800.0/1100.0*100, *second.PrefixCacheHitRate, 0.001)
	require.NotNil(t, second.KVCacheMaxConcurrency)
	assert.InDelta(t, 8.5, *second.KVCacheMaxConcurrency, 0.001)
}

func TestCollectAndStoreVLLMMetricsSkipsNonVLLMEndpoint(t *testing.T) {
	truncate(t)
	require.NoError(t, model.DB.AutoMigrate(&model.VLLMMetricSample{}, &model.VLLMMetricAggregate{}))
	t.Cleanup(func() {
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricSample{}).Error)
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricAggregate{}).Error)
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("other_service_requests_total 5\n"))
	}))
	defer server.Close()

	sample, recognized, err := CollectAndStoreVLLMMetrics(
		context.Background(),
		server.Client(),
		model.Channel{Id: 1, BaseURL: &server.URL},
		time.Now(),
	)

	require.NoError(t, err)
	assert.False(t, recognized)
	assert.Nil(t, sample)
	var count int64
	require.NoError(t, model.DB.Model(&model.VLLMMetricSample{}).Count(&count).Error)
	assert.Zero(t, count)
}

func TestCollectAndStoreVLLMMetricsRequiresVLLMCacheConfig(t *testing.T) {
	truncate(t)
	require.NoError(t, model.DB.AutoMigrate(&model.VLLMMetricSample{}, &model.VLLMMetricAggregate{}))
	t.Cleanup(func() {
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricSample{}).Error)
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricAggregate{}).Error)
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("vllm:num_requests_running 1\nvllm:generation_tokens_total 10\n"))
	}))
	defer server.Close()

	sample, recognized, err := CollectAndStoreVLLMMetrics(
		context.Background(),
		server.Client(),
		model.Channel{Id: 1, BaseURL: &server.URL},
		time.Now(),
	)

	require.NoError(t, err)
	assert.False(t, recognized)
	assert.Nil(t, sample)
}

func TestCollectAndStoreVLLMMetricsParsesLatencyHistograms(t *testing.T) {
	truncate(t)
	require.NoError(t, model.DB.AutoMigrate(&model.VLLMMetricSample{}, &model.VLLMMetricAggregate{}))
	t.Cleanup(func() {
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricSample{}).Error)
		require.NoError(t, model.DB.Where("1 = 1").Delete(&model.VLLMMetricAggregate{}).Error)
	})

	var requestCount atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if requestCount.Add(1) == 1 {
			_, _ = w.Write([]byte(vllmHistogramMetricsFixture(10, 5, 100, 4)))
			return
		}
		_, _ = w.Write([]byte(vllmHistogramMetricsFixture(12, 5.4, 200, 9)))
	}))
	defer server.Close()

	now := time.Date(2026, time.July, 15, 12, 0, 0, 0, time.UTC)
	channel := model.Channel{Id: 1, BaseURL: &server.URL}
	_, recognized, err := CollectAndStoreVLLMMetrics(context.Background(), server.Client(), channel, now)
	require.NoError(t, err)
	assert.True(t, recognized)
	second, recognized, err := CollectAndStoreVLLMMetrics(context.Background(), server.Client(), channel, now.Add(15*time.Second))

	require.NoError(t, err)
	assert.True(t, recognized)
	require.NotNil(t, second.TTFTMilliseconds)
	assert.InDelta(t, 200, *second.TTFTMilliseconds, 0.001)
	require.NotNil(t, second.DecodeTokensPerSecond)
	assert.InDelta(t, 20, *second.DecodeTokensPerSecond, 0.001)
}

func vllmMetricsFixture(
	generationTokens float64,
	ttftCount float64,
	ttftSum float64,
	itlCount float64,
	itlSum float64,
	running int,
	waiting int,
	kvCacheUsage float64,
	prefixQueries float64,
	prefixHits float64,
) string {
	return "# TYPE vllm:num_requests_running gauge\n" +
		"vllm:num_requests_running " + formatMetricNumber(running) + "\n" +
		"vllm:num_requests_waiting " + formatMetricNumber(waiting) + "\n" +
		"vllm:generation_tokens_total " + formatMetricFloat(generationTokens) + "\n" +
		"vllm:time_to_first_token_seconds_count " + formatMetricFloat(ttftCount) + "\n" +
		"vllm:time_to_first_token_seconds_sum " + formatMetricFloat(ttftSum) + "\n" +
		"vllm:inter_token_latency_seconds_count " + formatMetricFloat(itlCount) + "\n" +
		"vllm:inter_token_latency_seconds_sum " + formatMetricFloat(itlSum) + "\n" +
		"vllm:kv_cache_usage_perc " + formatMetricFloat(kvCacheUsage) + "\n" +
		"vllm:prefix_cache_queries_total " + formatMetricFloat(prefixQueries) + "\n" +
		"vllm:prefix_cache_hits_total " + formatMetricFloat(prefixHits) + "\n" +
		"vllm:cache_config_info{kv_cache_max_concurrency=\"8.5\"} 1\n"
}

func formatMetricNumber(value int) string {
	return strconv.Itoa(value)
}

func formatMetricFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}

func vllmHistogramMetricsFixture(ttftCount, ttftSum, itlCount, itlSum float64) string {
	return "# TYPE vllm:num_requests_running gauge\n" +
		"vllm:num_requests_running 1\n" +
		"# TYPE vllm:time_to_first_token_seconds histogram\n" +
		"vllm:time_to_first_token_seconds_bucket{le=\"+Inf\"} " + formatMetricFloat(ttftCount) + "\n" +
		"vllm:time_to_first_token_seconds_sum " + formatMetricFloat(ttftSum) + "\n" +
		"vllm:time_to_first_token_seconds_count " + formatMetricFloat(ttftCount) + "\n" +
		"# TYPE vllm:inter_token_latency_seconds histogram\n" +
		"vllm:inter_token_latency_seconds_bucket{le=\"+Inf\"} " + formatMetricFloat(itlCount) + "\n" +
		"vllm:inter_token_latency_seconds_sum " + formatMetricFloat(itlSum) + "\n" +
		"vllm:inter_token_latency_seconds_count " + formatMetricFloat(itlCount) + "\n" +
		"vllm:cache_config_info{kv_cache_max_concurrency=\"8.5\"} 1\n"
}
