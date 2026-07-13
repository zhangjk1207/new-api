package controller

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/setting/console_setting"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/errgroup"
)

const (
	requestTimeout     = 30 * time.Second
	httpTimeout        = 10 * time.Second
	uptimeKeySuffix    = "_24"
	apiStatusPath      = "/api/status-page/"
	apiHeartbeatPath   = "/api/status-page/heartbeat/"
	uptimeHistoryHours = 24
)

type Monitor struct {
	Name         string               `json:"name"`
	Uptime       float64              `json:"uptime"`
	Status       int                  `json:"status"`
	Group        string               `json:"group,omitempty"`
	ResponseTime float64              `json:"response_time"`
	History      []uptimeHistoryPoint `json:"history"`
}

type uptimeHistoryPoint struct {
	Timestamp int64 `json:"timestamp"`
	Status    int   `json:"status"`
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

	return json.NewDecoder(resp.Body).Decode(dest)
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

func parseUptimeHeartbeatTime(value string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02 15:04:05.000", value, time.Local)
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
	currentHour := now.In(time.Local).Truncate(time.Hour)
	firstHour := currentHour.Add(-(uptimeHistoryHours - 1) * time.Hour)
	history := make([]uptimeHistoryPoint, uptimeHistoryHours)
	latestInHour := make([]time.Time, uptimeHistoryHours)
	for i := range history {
		history[i] = uptimeHistoryPoint{
			Timestamp: firstHour.Add(time.Duration(i) * time.Hour).Unix(),
			Status:    -1,
		}
	}

	for _, heartbeat := range heartbeats {
		heartbeatTime, err := parseUptimeHeartbeatTime(heartbeat.Time)
		if err != nil {
			continue
		}
		hourIndex := int(heartbeatTime.Truncate(time.Hour).Sub(firstHour) / time.Hour)
		if hourIndex < 0 || hourIndex >= uptimeHistoryHours || !heartbeatTime.After(latestInHour[hourIndex]) {
			continue
		}
		latestInHour[hourIndex] = heartbeatTime
		history[hourIndex].Status = heartbeat.Status
	}

	return history
}

func GetUptimeKumaStatus(c *gin.Context) {
	groups := console_setting.GetUptimeKumaGroups()
	if len(groups) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": []UptimeGroupResult{}})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), requestTimeout)
	defer cancel()

	client := &http.Client{Timeout: httpTimeout}
	results := make([]UptimeGroupResult, len(groups))

	g, gCtx := errgroup.WithContext(ctx)
	for i, group := range groups {
		i, group := i, group
		g.Go(func() error {
			results[i] = fetchGroupData(gCtx, client, group)
			return nil
		})
	}

	g.Wait()
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": results})
}
