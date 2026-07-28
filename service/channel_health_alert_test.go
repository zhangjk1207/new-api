package service

import (
	"context"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotifyChannelHealthTransitionsSkipsWhenWebhookIsNotConfigured(t *testing.T) {
	t.Setenv(channelHealthWeComWebhookEnv, "")
	err := notifyChannelHealthTransitions(
		context.Background(),
		[]model.Channel{{Id: 1, Name: "channel"}},
		[]model.ChannelHealthCheck{{ChannelID: 1, Status: 0}},
		map[int]int{1: 1},
	)
	require.NoError(t, err)
}

func TestNotifyChannelHealthTransitionsSkipsUnchangedStatuses(t *testing.T) {
	t.Setenv(channelHealthWeComWebhookEnv, "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test")
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
