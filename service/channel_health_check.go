package service

import (
	"context"
	"errors"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	clientmodel "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
	"golang.org/x/sync/errgroup"
)

const (
	channelHealthCheckTimeout  = 5 * time.Second
	channelHealthHistoryPeriod = 7 * 24 * time.Hour
)

type ChannelHealthCheckSummary struct {
	Total int `json:"total"`
	Up    int `json:"up"`
}

type channelHealthMetrics struct {
	TokenCount      float64
	TokensPerSecond *float64
	MaxConcurrency  *int
}

type channelHealthTokenSample struct {
	TokenCount float64
	Collected  time.Time
}

var channelHealthTokenSamples = struct {
	sync.Mutex
	values map[string]channelHealthTokenSample
}{
	values: make(map[string]channelHealthTokenSample),
}

func RunChannelHealthCheck(ctx context.Context) (ChannelHealthCheckSummary, error) {
	var channels []model.Channel
	if err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error; err != nil {
		return ChannelHealthCheckSummary{}, err
	}

	client := &http.Client{Timeout: channelHealthCheckTimeout}
	checks := make([]model.ChannelHealthCheck, len(channels))
	g, gCtx := errgroup.WithContext(ctx)
	for i, channel := range channels {
		i, channel := i, channel
		g.Go(func() error {
			checks[i] = checkChannelHealth(gCtx, client, channel)
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return ChannelHealthCheckSummary{}, err
	}

	summary := ChannelHealthCheckSummary{Total: len(checks)}
	for _, check := range checks {
		if check.Status == 1 {
			summary.Up++
		}
	}
	if err := model.CreateChannelHealthChecks(checks); err != nil {
		return ChannelHealthCheckSummary{}, err
	}
	if err := model.DeleteChannelHealthChecksBefore(time.Now().Add(-channelHealthHistoryPeriod).Unix()); err != nil {
		return ChannelHealthCheckSummary{}, err
	}
	return summary, nil
}

func checkChannelHealth(ctx context.Context, client *http.Client, channel model.Channel) model.ChannelHealthCheck {
	checkedAt := time.Now().Unix()
	check := model.ChannelHealthCheck{
		ChannelID: channel.Id,
		Status:    0,
		CheckedAt: checkedAt,
	}
	baseURL := strings.TrimSuffix(channel.GetBaseURL(), "/")
	if baseURL == "" {
		return check
	}

	startedAt := time.Now()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/health", nil)
	if err != nil {
		return check
	}
	resp, err := client.Do(req)
	check.ResponseTime = int(time.Since(startedAt).Milliseconds())
	if err != nil {
		return check
	}
	resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return check
	}
	check.Status = 1

	metrics, err := fetchChannelHealthMetrics(ctx, client, baseURL)
	if err == nil {
		check.TokensPerSecond = metrics.TokensPerSecond
		check.MaxConcurrency = metrics.MaxConcurrency
	}
	return check
}

func fetchChannelHealthMetrics(ctx context.Context, client *http.Client, baseURL string) (channelHealthMetrics, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/metrics", nil)
	if err != nil {
		return channelHealthMetrics{}, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return channelHealthMetrics{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return channelHealthMetrics{}, errors.New("non-200 metrics status")
	}

	metrics, err := parseChannelHealthMetrics(resp.Body)
	if err != nil {
		return channelHealthMetrics{}, err
	}
	now := time.Now()
	channelHealthTokenSamples.Lock()
	if previous, exists := channelHealthTokenSamples.values[baseURL]; exists {
		duration := now.Sub(previous.Collected).Seconds()
		if duration > 0 && metrics.TokenCount >= previous.TokenCount {
			rate := (metrics.TokenCount - previous.TokenCount) / duration
			metrics.TokensPerSecond = &rate
		}
	}
	channelHealthTokenSamples.values[baseURL] = channelHealthTokenSample{
		TokenCount: metrics.TokenCount,
		Collected:  now,
	}
	channelHealthTokenSamples.Unlock()
	return metrics, nil
}

func parseChannelHealthMetrics(reader io.Reader) (channelHealthMetrics, error) {
	decoder := expfmt.NewDecoder(reader, expfmt.FmtText)
	metrics := channelHealthMetrics{}
	for {
		family := &clientmodel.MetricFamily{}
		err := decoder.Decode(family)
		if errors.Is(err, io.EOF) {
			return metrics, nil
		}
		if err != nil {
			return channelHealthMetrics{}, err
		}

		switch family.GetName() {
		case "vllm:prompt_tokens_total", "vllm:generation_tokens_total":
			for _, metric := range family.Metric {
				metrics.TokenCount += metric.GetCounter().GetValue()
			}
		case "vllm:cache_config_info":
			for _, metric := range family.Metric {
				for _, label := range metric.Label {
					if label.GetName() != "kv_cache_max_concurrency" {
						continue
					}
					value, err := strconv.ParseFloat(label.GetValue(), 64)
					if err != nil || value < 0 {
						continue
					}
					rounded := int(math.Round(value))
					metrics.MaxConcurrency = &rounded
				}
			}
		}
	}
}
