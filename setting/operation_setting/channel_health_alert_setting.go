package operation_setting

import (
	"os"
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

const (
	DefaultChannelHealthCheckIntervalMinutes = 1
	DefaultChannelHealthFailureThreshold     = 3
)

type ChannelHealthAlertSetting struct {
	Enabled              bool   `json:"enabled"`
	CheckIntervalMinutes int    `json:"check_interval_minutes"`
	FailureThreshold     int    `json:"failure_threshold"`
	RecoveryEnabled      bool   `json:"recovery_enabled"`
	WeComWebhookURL      string `json:"wecom_webhook_url"`
	Environment          string `json:"environment"`
}

var channelHealthAlertSetting = ChannelHealthAlertSetting{
	Enabled:              false,
	CheckIntervalMinutes: DefaultChannelHealthCheckIntervalMinutes,
	FailureThreshold:     DefaultChannelHealthFailureThreshold,
	RecoveryEnabled:      true,
	Environment:          "智擎模型服务平台",
}

func init() {
	config.GlobalConfig.Register("channel_health_alert_setting", &channelHealthAlertSetting)
}

func GetChannelHealthAlertSetting() ChannelHealthAlertSetting {
	setting := channelHealthAlertSetting
	if strings.TrimSpace(setting.WeComWebhookURL) == "" {
		setting.WeComWebhookURL = strings.TrimSpace(os.Getenv("CHANNEL_HEALTH_WECOM_WEBHOOK_URL"))
	}
	if environment := strings.TrimSpace(os.Getenv("CHANNEL_HEALTH_ALERT_ENVIRONMENT")); setting.Environment == "智擎模型服务平台" && environment != "" {
		setting.Environment = environment
	}
	if setting.CheckIntervalMinutes < 1 {
		setting.CheckIntervalMinutes = DefaultChannelHealthCheckIntervalMinutes
	}
	if setting.FailureThreshold < 2 {
		setting.FailureThreshold = DefaultChannelHealthFailureThreshold
	}
	return setting
}
