package service

import (
	"context"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotifyChannelHealthTransitionsSkipsWhenWebhookIsNotConfigured(t *testing.T) {
	setChannelHealthAlertSettingForTest(t, map[string]string{
		"enabled":           "true",
		"wecom_webhook_url": "",
	})
	t.Setenv("CHANNEL_HEALTH_WECOM_WEBHOOK_URL", "")
	err := notifyChannelHealthTransitions(
		context.Background(),
		[]model.Channel{{Id: 1, Name: "channel"}},
		[]model.ChannelHealthCheck{{ChannelID: 1, Status: 0}},
		map[int]int{1: 1},
	)
	require.NoError(t, err)
}

func TestNotifyChannelHealthTransitionsSkipsUnchangedStatuses(t *testing.T) {
	setChannelHealthAlertSettingForTest(t, map[string]string{
		"enabled":           "true",
		"wecom_webhook_url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test",
	})
	err := notifyChannelHealthTransitions(
		context.Background(),
		[]model.Channel{{Id: 1, Name: "channel"}},
		[]model.ChannelHealthCheck{{ChannelID: 1, Status: 1}},
		map[int]int{1: 1},
	)
	require.NoError(t, err)
}

func TestBuildChannelHealthAlertContentIncludesDownAndRecoveryTransitions(t *testing.T) {
	content, ok := buildChannelHealthAlertContent(
		[]model.Channel{{Id: 1, Name: "down-model"}, {Id: 2, Name: "recovered-model"}},
		[]model.ChannelHealthCheck{
			{ChannelID: 1, Status: 0},
			{ChannelID: 2, Status: 1, ResponseTime: 36},
		},
		map[int]int{1: 2, 2: 0},
		"test",
		3,
		true,
		time.Date(2026, 7, 28, 7, 30, 0, 0, time.UTC),
	)

	require.True(t, ok)
	assert.Contains(t, content, "环境：test")
	assert.Contains(t, content, "时间：2026-07-28 15:30:00")
	assert.Contains(t, content, "异常</font> 渠道 #1 down-model")
	assert.Contains(t, content, "恢复</font> 渠道 #2 recovered-model，响应时间 36 ms")
}

func TestBuildChannelHealthAlertContentIgnoresInitialAndUnchangedChecks(t *testing.T) {
	content, ok := buildChannelHealthAlertContent(
		[]model.Channel{{Id: 1, Name: "new"}, {Id: 2, Name: "healthy"}},
		[]model.ChannelHealthCheck{{ChannelID: 1, Status: 0}, {ChannelID: 2, Status: 1}},
		map[int]int{2: 1},
		"test",
		3,
		true,
		time.Now(),
	)

	assert.False(t, ok)
	assert.Empty(t, content)
}

func TestBuildChannelHealthAlertContentCanSuppressRecovery(t *testing.T) {
	content, ok := buildChannelHealthAlertContent(
		[]model.Channel{{Id: 1, Name: "recovered-model"}},
		[]model.ChannelHealthCheck{{ChannelID: 1, Status: 1, ResponseTime: 36}},
		map[int]int{1: 0},
		"test",
		5,
		false,
		time.Now(),
	)

	assert.False(t, ok)
	assert.Empty(t, content)
}

func TestSendWeComMarkdownRejectsNonEnterpriseWeChatURL(t *testing.T) {
	err := sendWeComMarkdown(context.Background(), "https://example.com/hook?key=test", "alert")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid enterprise WeChat webhook URL")
}

func setChannelHealthAlertSettingForTest(t *testing.T, values map[string]string) {
	t.Helper()
	setting := config.GlobalConfig.Get("channel_health_alert_setting")
	require.NotNil(t, setting)
	original, err := config.ConfigToMap(setting)
	require.NoError(t, err)
	require.NoError(t, config.UpdateConfigFromMap(setting, values))
	t.Cleanup(func() {
		require.NoError(t, config.UpdateConfigFromMap(setting, original))
	})
}
