package operation_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/setting/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetChannelHealthAlertSettingUsesEnvironmentFallback(t *testing.T) {
	original, err := config.ConfigToMap(&channelHealthAlertSetting)
	require.NoError(t, err)
	t.Cleanup(func() {
		require.NoError(t, config.UpdateConfigFromMap(&channelHealthAlertSetting, original))
	})
	require.NoError(t, config.UpdateConfigFromMap(&channelHealthAlertSetting, map[string]string{
		"wecom_webhook_url": "",
		"environment":       "智擎模型服务平台",
	}))
	t.Setenv("CHANNEL_HEALTH_WECOM_WEBHOOK_URL", "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test")
	t.Setenv("CHANNEL_HEALTH_ALERT_ENVIRONMENT", "测试环境")

	setting := GetChannelHealthAlertSetting()

	assert.Equal(t, "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test", setting.WeComWebhookURL)
	assert.Equal(t, "测试环境", setting.Environment)
}

func TestGetChannelHealthAlertSettingNormalizesInvalidThresholds(t *testing.T) {
	original, err := config.ConfigToMap(&channelHealthAlertSetting)
	require.NoError(t, err)
	t.Cleanup(func() {
		require.NoError(t, config.UpdateConfigFromMap(&channelHealthAlertSetting, original))
	})
	require.NoError(t, config.UpdateConfigFromMap(&channelHealthAlertSetting, map[string]string{
		"check_interval_minutes": "0",
		"failure_threshold":      "1",
	}))

	setting := GetChannelHealthAlertSetting()

	assert.Equal(t, DefaultChannelHealthCheckIntervalMinutes, setting.CheckIntervalMinutes)
	assert.Equal(t, DefaultChannelHealthFailureThreshold, setting.FailureThreshold)
}
