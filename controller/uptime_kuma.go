package controller

import (
	"context"
	"errors"
	"io"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/console_setting"

	"github.com/gin-gonic/gin"
	clientmodel "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
	"golang.org/x/sync/errgroup"
)

const (
	requestTimeout     = 30 * time.Second
	httpTimeout        = 10 * time.Second
	uptimeKeySuffix    = "_24"
	apiStatusPath      = "/api/status-page/"
	apiHeartbeatPath   = "/api/status-page/heartbeat/"
	uptimeHistoryHours = 24
	metricsPath        = "/metrics"
	uptimeCacheTTL     = 15 * time.Second
)

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

type uptimeHeartbeat struct {
	Status int     `json:"status"`
	Time   string  `json:"time"`
	Ping   float64 `json:"ping"`
}

type UptimeGroupResult struct {
	CategoryName string    `json:"categoryName"`
	Monitors     []Monitor `json:"monitors"`
}

type vllmMetrics struct {
	TokenCount      float64
	TokensPerSecond *float64
	MaxConcurrency  *int
}

type tokenSample struct {
	TokenCount float64
	Collected  time.Time
}

var uptimeKumaTokenSamples = struct {
	sync.Mutex
	values map[string]tokenSample
}{
	values: make(map[string]tokenSample),
}

var uptimeKumaStatusCache = struct {
	sync.Mutex
	results     []UptimeGroupResult
	refreshedAt time.Time
	ready       bool
	refreshing  bool
}{}

func getAndDecode(ctx context.Context, client *http.Client, url string, dest interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("non-200 status")
	}

	return common.DecodeJson(resp.Body, dest)
}

func fetchGroupData(ctx context.Context, client *http.Client, groupConfig map[string]interface{}) UptimeGroupResult {
	url, _ := groupConfig["url"].(string)
	slug, _ := groupConfig["slug"].(string)
	categoryName, _ := groupConfig["categoryName"].(string)

	result := UptimeGroupResult{
		CategoryName: categoryName,
		Monitors:     []Monitor{},
	}

	if url == "" || slug == "" {
		return result
	}

	baseURL := strings.TrimSuffix(url, "/")

	var statusData struct {
		PublicGroupList []struct {
			ID          int    `json:"id"`
			Name        string `json:"name"`
			MonitorList []struct {
				ID   int    `json:"id"`
				Name string `json:"name"`
			} `json:"monitorList"`
		} `json:"publicGroupList"`
	}

	var heartbeatData struct {
		HeartbeatList map[string][]uptimeHeartbeat `json:"heartbeatList"`
		UptimeList    map[string]float64           `json:"uptimeList"`
	}

	g, gCtx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return getAndDecode(gCtx, client, baseURL+apiStatusPath+slug, &statusData)
	})
	g.Go(func() error {
		return getAndDecode(gCtx, client, baseURL+apiHeartbeatPath+slug, &heartbeatData)
	})

	if g.Wait() != nil {
		return result
	}

	now := time.Now()
	for _, pg := range statusData.PublicGroupList {
		if len(pg.MonitorList) == 0 {
			continue
		}

		for _, m := range pg.MonitorList {
			monitor := Monitor{
				Name:    m.Name,
				Group:   pg.Name,
				Status:  -1,
				History: buildMonitorHistory(nil, now),
			}

			monitorID := strconv.Itoa(m.ID)

			if uptime, exists := heartbeatData.UptimeList[monitorID+uptimeKeySuffix]; exists {
				monitor.Uptime = uptime
			}

			if heartbeats, exists := heartbeatData.HeartbeatList[monitorID]; exists {
				monitor.History = buildMonitorHistory(heartbeats, now)
				if latest, ok := getLatestHeartbeat(heartbeats); ok {
					monitor.Status = latest.Status
					monitor.ResponseTime = latest.Ping
				}
			}
			result.Monitors = append(result.Monitors, monitor)
		}
	}

	return result
}

func fetchMonitorMetrics(ctx context.Context, client *http.Client, channels []model.Channel) map[string]vllmMetrics {
	metricsByMonitorName := make(map[string]vllmMetrics)
	if len(channels) == 0 {
		return metricsByMonitorName
	}

	baseURLByMonitorName := make(map[string]string)
	monitorNamesByBaseURL := make(map[string][]string)
	for _, channel := range channels {
		baseURL := strings.TrimSuffix(channel.GetBaseURL(), "/")
		if baseURL == "" {
			continue
		}
		baseURLByMonitorName[channel.Name] = baseURL
		monitorNamesByBaseURL[baseURL] = append(monitorNamesByBaseURL[baseURL], channel.Name)
	}

	metricsByBaseURL := make(map[string]vllmMetrics)
	var mu sync.Mutex
	var g errgroup.Group
	for baseURL := range monitorNamesByBaseURL {
		baseURL := baseURL
		g.Go(func() error {
			metrics, err := fetchVLLMMetrics(ctx, client, baseURL)
			if err != nil {
				return nil
			}
			mu.Lock()
			metricsByBaseURL[baseURL] = metrics
			mu.Unlock()
			return nil
		})
	}
	g.Wait()

	for monitorName, baseURL := range baseURLByMonitorName {
		if metrics, exists := metricsByBaseURL[baseURL]; exists {
			metricsByMonitorName[monitorName] = metrics
		}
	}

	return metricsByMonitorName
}

func fetchVLLMMetrics(ctx context.Context, client *http.Client, baseURL string) (vllmMetrics, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+metricsPath, nil)
	if err != nil {
		return vllmMetrics{}, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return vllmMetrics{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return vllmMetrics{}, errors.New("non-200 metrics status")
	}

	metrics, err := parseVLLMMetrics(resp.Body)
	if err != nil {
		return vllmMetrics{}, err
	}

	now := time.Now()
	uptimeKumaTokenSamples.Lock()
	if previous, exists := uptimeKumaTokenSamples.values[baseURL]; exists {
		if tokensPerSecond, ok := calculateTokensPerSecond(previous.TokenCount, previous.Collected, metrics.TokenCount, now); ok {
			metrics.TokensPerSecond = &tokensPerSecond
		}
	}
	uptimeKumaTokenSamples.values[baseURL] = tokenSample{TokenCount: metrics.TokenCount, Collected: now}
	uptimeKumaTokenSamples.Unlock()

	return metrics, nil
}

func parseVLLMMetrics(reader io.Reader) (vllmMetrics, error) {
	decoder := expfmt.NewDecoder(reader, expfmt.FmtText)
	metrics := vllmMetrics{}
	for {
		family := &clientmodel.MetricFamily{}
		err := decoder.Decode(family)
		if errors.Is(err, io.EOF) {
			return metrics, nil
		}
		if err != nil {
			return vllmMetrics{}, err
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

func calculateTokensPerSecond(previousCount float64, previousTime time.Time, currentCount float64, currentTime time.Time) (float64, bool) {
	duration := currentTime.Sub(previousTime).Seconds()
	if duration <= 0 || currentCount < previousCount {
		return 0, false
	}
	return (currentCount - previousCount) / duration, true
}

func parseUptimeHeartbeatTime(value string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02 15:04:05.000", value, time.UTC)
}

func getLatestHeartbeat(heartbeats []uptimeHeartbeat) (uptimeHeartbeat, bool) {
	var latest uptimeHeartbeat
	var latestTime time.Time
	found := false
	for _, heartbeat := range heartbeats {
		heartbeatTime, err := parseUptimeHeartbeatTime(heartbeat.Time)
		if err != nil || (found && !heartbeatTime.After(latestTime)) {
			continue
		}
		latest = heartbeat
		latestTime = heartbeatTime
		found = true
	}
	return latest, found
}

func buildMonitorHistory(heartbeats []uptimeHeartbeat, now time.Time) []uptimeHistoryPoint {
	firstHeartbeatTime := now.Add(-uptimeHistoryHours * time.Hour)
	history := make([]uptimeHistoryPoint, 0, len(heartbeats))

	for _, heartbeat := range heartbeats {
		heartbeatTime, err := parseUptimeHeartbeatTime(heartbeat.Time)
		if err != nil {
			continue
		}
		if heartbeatTime.Before(firstHeartbeatTime) || heartbeatTime.After(now) {
			continue
		}
		history = append(history, uptimeHistoryPoint{
			Timestamp:    heartbeatTime.Unix(),
			Status:       heartbeat.Status,
			ResponseTime: heartbeat.Ping,
		})
	}

	sort.Slice(history, func(i, j int) bool {
		return history[i].Timestamp < history[j].Timestamp
	})

	return history
}

func getEnabledMonitoringChannels() ([]model.Channel, error) {
	var channels []model.Channel
	err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error
	return channels, err
}

func reconcileEnabledChannelMonitors(channels []model.Channel, kumaMonitors map[string]Monitor, metricsByMonitorName map[string]vllmMetrics, now time.Time) []Monitor {
	monitors := make([]Monitor, 0, len(channels))
	for _, channel := range channels {
		if channel.Status != common.ChannelStatusEnabled {
			continue
		}

		monitor, exists := kumaMonitors[channel.Name]
		if !exists {
			monitor = Monitor{
				Name:    channel.Name,
				Status:  -1,
				History: buildMonitorHistory(nil, now),
			}
		}
		monitor.Name = channel.Name
		monitor.Group = channel.Group
		if metrics, exists := metricsByMonitorName[channel.Name]; exists {
			monitor.TokensPerSecond = metrics.TokensPerSecond
			monitor.MaxConcurrency = metrics.MaxConcurrency
		}
		monitors = append(monitors, monitor)
	}

	sort.Slice(monitors, func(i, j int) bool {
		return monitors[i].Name < monitors[j].Name
	})
	return monitors
}

func fetchUptimeKumaStatus(ctx context.Context) []UptimeGroupResult {
	groups := console_setting.GetUptimeKumaGroups()
	if len(groups) == 0 {
		return []UptimeGroupResult{}
	}

	channels, err := getEnabledMonitoringChannels()
	if err != nil {
		common.SysError("failed to load enabled channels for service monitoring: " + err.Error())
		return []UptimeGroupResult{}
	}

	client := &http.Client{Timeout: httpTimeout}
	results := make([]UptimeGroupResult, len(groups))
	metricsByMonitorName := make(map[string]vllmMetrics)
	g, gCtx := errgroup.WithContext(ctx)
	for i, group := range groups {
		i, group := i, group
		g.Go(func() error {
			results[i] = fetchGroupData(gCtx, client, group)
			return nil
		})
	}
	g.Go(func() error {
		metricsByMonitorName = fetchMonitorMetrics(gCtx, client, channels)
		return nil
	})
	g.Wait()

	kumaMonitors := make(map[string]Monitor)
	for _, result := range results {
		for _, monitor := range result.Monitors {
			if _, exists := kumaMonitors[monitor.Name]; !exists {
				kumaMonitors[monitor.Name] = monitor
			}
		}
	}

	return []UptimeGroupResult{{
		Monitors: reconcileEnabledChannelMonitors(channels, kumaMonitors, metricsByMonitorName, time.Now()),
	}}
}

func refreshUptimeKumaStatusCache() {
	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()
	results := fetchUptimeKumaStatus(ctx)

	uptimeKumaStatusCache.Lock()
	uptimeKumaStatusCache.results = results
	uptimeKumaStatusCache.refreshedAt = time.Now()
	uptimeKumaStatusCache.ready = true
	uptimeKumaStatusCache.refreshing = false
	uptimeKumaStatusCache.Unlock()
}

func getCachedUptimeKumaStatus() ([]UptimeGroupResult, bool) {
	uptimeKumaStatusCache.Lock()
	defer uptimeKumaStatusCache.Unlock()

	if uptimeKumaStatusCache.ready && time.Since(uptimeKumaStatusCache.refreshedAt) < uptimeCacheTTL {
		return uptimeKumaStatusCache.results, true
	}
	if uptimeKumaStatusCache.ready {
		if !uptimeKumaStatusCache.refreshing {
			uptimeKumaStatusCache.refreshing = true
			go refreshUptimeKumaStatusCache()
		}
		return uptimeKumaStatusCache.results, true
	}
	if uptimeKumaStatusCache.refreshing {
		return nil, true
	}
	uptimeKumaStatusCache.refreshing = true
	return nil, false
}

func GetUptimeKumaStatus(c *gin.Context) {
	results, cached := getCachedUptimeKumaStatus()
	if !cached {
		refreshUptimeKumaStatusCache()
		results, _ = getCachedUptimeKumaStatus()
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": results})
}
