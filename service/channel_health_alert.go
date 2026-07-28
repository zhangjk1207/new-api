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
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

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
	setting := operation_setting.GetChannelHealthAlertSetting()
	webhookURL := strings.TrimSpace(setting.WeComWebhookURL)
	if !setting.Enabled || webhookURL == "" {
		return nil
	}
	content, hasTransitions := buildChannelHealthAlertContent(
		channels,
		checks,
		previousStatuses,
		setting.Environment,
		setting.FailureThreshold,
		setting.RecoveryEnabled,
		time.Now(),
	)
	if !hasTransitions {
		return nil
	}
	return sendChannelHealthAlert(ctx, webhookURL, content, "channel_transition")
}

func buildChannelHealthAlertContent(
	channels []model.Channel,
	checks []model.ChannelHealthCheck,
	previousStatuses map[int]int,
	environment string,
	failureThreshold int,
	recoveryEnabled bool,
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
				`><font color="warning">异常</font> 渠道 #%d %s，连续 %d 次检查失败`,
				check.ChannelID,
				channelName,
				failureThreshold,
			))
		case previousStatus == 0 && check.Status == 1 && recoveryEnabled:
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

func ValidateWeComWebhookURL(webhookURL string) error {
	parsedURL, err := url.Parse(webhookURL)
	if err != nil || parsedURL.Scheme != "https" || parsedURL.Hostname() != "qyapi.weixin.qq.com" ||
		parsedURL.Path != "/cgi-bin/webhook/send" || parsedURL.Query().Get("key") == "" {
		return fmt.Errorf("invalid enterprise WeChat webhook URL")
	}
	return nil
}

func SendChannelHealthTestAlert(ctx context.Context, webhookURL string, environment string) error {
	content := fmt.Sprintf(
		"## 智擎渠道监控测试\n>环境：%s\n>时间：%s\n><font color=\"info\">通知链路正常</font>",
		html.EscapeString(environment),
		time.Now().In(time.FixedZone("Asia/Shanghai", 8*60*60)).Format("2006-01-02 15:04:05"),
	)
	return sendChannelHealthAlert(ctx, webhookURL, content, "test")
}

func sendChannelHealthAlert(ctx context.Context, webhookURL string, content string, eventType string) error {
	err := sendWeComMarkdown(ctx, webhookURL, content)
	state := model.ChannelHealthAlertState{
		LastAttemptAt: time.Now().Unix(),
		LastSuccess:   err == nil,
		LastEventType: eventType,
	}
	if err != nil {
		state.LastError = err.Error()
	}
	if stateErr := model.SaveChannelHealthAlertState(state); stateErr != nil && err == nil {
		return fmt.Errorf("save channel health alert result: %w", stateErr)
	}
	return err
}

func sendWeComMarkdown(ctx context.Context, webhookURL string, content string) error {
	if err := ValidateWeComWebhookURL(webhookURL); err != nil {
		return err
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
