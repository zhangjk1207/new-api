package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestRunChannelHealthCheckStoresHealthAndMetricsForEnabledChannels(t *testing.T) {
	truncate(t)
	require.NoError(t, model.DB.AutoMigrate(&model.ChannelHealthCheck{}))
	t.Cleanup(func() {
		require.NoError(t, model.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&model.ChannelHealthCheck{}).Error)
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/health":
			w.WriteHeader(http.StatusOK)
		case "/metrics":
			_, _ = w.Write([]byte(`
vllm:prompt_tokens_total 125
vllm:generation_tokens_total 75
vllm:cache_config_info{kv_cache_max_concurrency="3.6"} 1
`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	require.NoError(t, model.DB.Create(&model.Channel{
		Id:      1,
		Name:    "healthy",
		Status:  common.ChannelStatusEnabled,
		BaseURL: &server.URL,
	}).Error)
	require.NoError(t, model.DB.Create(&model.Channel{
		Id:      2,
		Name:    "disabled",
		Status:  common.ChannelStatusManuallyDisabled,
		BaseURL: &server.URL,
	}).Error)

	summary, err := RunChannelHealthCheck(context.Background())

	require.NoError(t, err)
	assert.Equal(t, 1, summary.Total)
	assert.Equal(t, 1, summary.Up)
	var checks []model.ChannelHealthCheck
	require.NoError(t, model.DB.Order("channel_id asc").Find(&checks).Error)
	require.Len(t, checks, 1)
	assert.Equal(t, 1, checks[0].ChannelID)
	assert.Equal(t, 1, checks[0].Status)
	require.NotNil(t, checks[0].MaxConcurrency)
	assert.Equal(t, 4, *checks[0].MaxConcurrency)
}

func TestRunChannelHealthCheckRequiresThreeConsecutiveFailuresToMarkDown(t *testing.T) {
	truncate(t)
	require.NoError(t, model.DB.AutoMigrate(&model.ChannelHealthCheck{}))
	t.Cleanup(func() {
		require.NoError(t, model.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&model.ChannelHealthCheck{}).Error)
	})

	var healthy atomic.Bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			http.NotFound(w, r)
			return
		}
		if !healthy.Load() {
			http.Error(w, "temporarily unavailable", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	require.NoError(t, model.DB.Create(&model.Channel{
		Id: 1, Name: "flaky", Status: common.ChannelStatusEnabled, BaseURL: &server.URL,
	}).Error)

	for attempt, expectedStatus := range []int{2, 2, 0} {
		summary, err := RunChannelHealthCheck(context.Background())
		require.NoError(t, err)
		assert.Equal(t, 1, summary.Total)
		if expectedStatus == 0 {
			assert.Equal(t, 0, summary.Up)
		} else {
			assert.Equal(t, 1, summary.Up)
		}

		var check model.ChannelHealthCheck
		require.NoError(t, model.DB.Order("id desc").First(&check).Error)
		assert.Equal(t, expectedStatus, check.Status, "attempt %d", attempt+1)
	}

	healthy.Store(true)
	summary, err := RunChannelHealthCheck(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 1, summary.Up)
	var recovered model.ChannelHealthCheck
	require.NoError(t, model.DB.Order("id desc").First(&recovered).Error)
	assert.Equal(t, 1, recovered.Status)
}

func TestCheckChannelHealthUsesVLLMMetricsWhenHealthEndpointFails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/health":
			http.Error(w, "temporarily unavailable", http.StatusServiceUnavailable)
		case "/metrics":
			_, _ = w.Write([]byte(`
vllm:generation_tokens_total 75
vllm:cache_config_info{kv_cache_max_concurrency="3.6"} 1
`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	check := checkChannelHealth(context.Background(), server.Client(), model.Channel{
		Id: 1, Name: "vllm", Status: common.ChannelStatusEnabled, BaseURL: &server.URL,
	})

	assert.Equal(t, 1, check.Status)
	require.NotNil(t, check.MaxConcurrency)
	assert.Equal(t, 4, *check.MaxConcurrency)
}

func TestCheckChannelHealthRejectsUnrecognizedMetricsFallback(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/health":
			http.Error(w, "temporarily unavailable", http.StatusServiceUnavailable)
		case "/metrics":
			_, _ = w.Write([]byte("http_requests_total 10\n"))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	check := checkChannelHealth(context.Background(), server.Client(), model.Channel{
		Id: 1, Name: "generic", Status: common.ChannelStatusEnabled, BaseURL: &server.URL,
	})

	assert.Equal(t, 0, check.Status)
}
