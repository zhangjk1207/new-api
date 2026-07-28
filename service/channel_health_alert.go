package service

import (
	"bytes"
	"context"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const channelHealthWeComWebhookEnv = "CHANNEL_HEALTH_WECOM_WEBHOOK_URL"

type weComMarkdownMessage struct {
	MsgType  string            `json:"msgtype"`
	Markdown map[string]string `json:"markdown"`
}

type weComWebhookResponse struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

func notifyChannelHealthTransitions(
	ctx context.Context,
	channels []model.Channel,
	checks []model.ChannelHealthCheck,
	previousStatuses map[int]int,
) error {
	webhookURL := strings.TrimSpace(common.GetEnvOrDefaultString(channelHealthWeComWebhookEnv, ""))
	if webhookURL == "" {
		return nil
	}
	environment := common.GetEnvOrDefaultString("CHANNEL_HEALTH_ALERT_ENVIRONMENT", common.NodeName)
	content, hasTransitions := buildChannelHealthAlertContent(channels, checks, previousStatuses, environment, time.Now())
	if !hasTransitions {
		return nil
	}
	return sendWeComMarkdown(ctx, webhookURL, content)
}

func buildChannelHealthAlertContent(
	channels []model.Channel,
	checks []model.ChannelHealthCheck,
	previousStatuses map[int]int,
	environment string,
	now time.Time,
) (string, bool) {
	channelsByID := make(map[int]model.Channel, len(channels))
	for _, channel := range channels {
		channelsByID[channel.Id] = channel
	}

	lines := make([]string, 0)
	for _, check := range checks {
		previousStatus, exists := previousStatuses[check.ChannelID]
		if !exists {
			continue
		}
		channel := channelsByID[check.ChannelID]
		channelName := html.EscapeString(channel.Name)
		switch {
		case previousStatus != 0 && check.Status == 0:
			lines = append(lines, fmt.Sprintf(
				`><font color="warning">异常</font> 渠道 #%d %s，连续 3 次检查失败`,
				check.ChannelID,
				channelName,
			))
		case previousStatus == 0 && check.Status == 1:
			lines = append(lines, fmt.Sprintf(
				`><font color="info">恢复</font> 渠道 #%d %s，响应时间 %d ms`,
				check.ChannelID,
				channelName,
				check.ResponseTime,
			))
		}
	}
	if len(lines) == 0 {
		return "", false
	}

	content := fmt.Sprintf(
		"## 智擎渠道监控告警\n>环境：%s\n>时间：%s\n%s",
		html.EscapeString(environment),
		now.In(time.FixedZone("Asia/Shanghai", 8*60*60)).Format("2006-01-02 15:04:05"),
		strings.Join(lines, "\n"),
	)
	return content, true
}

func sendWeComMarkdown(ctx context.Context, webhookURL string, content string) error {
	parsedURL, err := url.Parse(webhookURL)
	if err != nil || parsedURL.Scheme != "https" || parsedURL.Hostname() != "qyapi.weixin.qq.com" ||
		parsedURL.Path != "/cgi-bin/webhook/send" || parsedURL.Query().Get("key") == "" {
		return fmt.Errorf("invalid enterprise WeChat webhook URL")
	}

	payload, err := common.Marshal(weComMarkdownMessage{
		MsgType:  "markdown",
		Markdown: map[string]string{"content": content},
	})
	if err != nil {
		return fmt.Errorf("marshal enterprise WeChat alert: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create enterprise WeChat alert request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("send enterprise WeChat alert request")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("enterprise WeChat webhook returned HTTP %d", resp.StatusCode)
	}

	var result weComWebhookResponse
	if err := common.DecodeJson(resp.Body, &result); err != nil {
		return fmt.Errorf("decode enterprise WeChat webhook response: %w", err)
	}
	if result.ErrCode != 0 {
		return fmt.Errorf("enterprise WeChat webhook rejected alert: code=%d message=%s", result.ErrCode, result.ErrMsg)
	}
	return nil
}
