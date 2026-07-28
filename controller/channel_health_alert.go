package controller

import (
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

var channelHealthAlertIntervals = map[int]struct{}{
	1:  {},
	2:  {},
	5:  {},
	10: {},
}

type channelHealthAlertConfigRequest struct {
	Enabled              bool   `json:"enabled"`
	CheckIntervalMinutes int    `json:"check_interval_minutes"`
	FailureThreshold     int    `json:"failure_threshold"`
	RecoveryEnabled      bool   `json:"recovery_enabled"`
	WeComWebhookURL      string `json:"wecom_webhook_url"`
	ClearWebhook         bool   `json:"clear_webhook"`
	Environment          string `json:"environment"`
}

type channelHealthAlertTestRequest struct {
	WeComWebhookURL string `json:"wecom_webhook_url"`
	Environment     string `json:"environment"`
}

type channelHealthAlertConfigResponse struct {
	Enabled              bool                          `json:"enabled"`
	CheckIntervalMinutes int                           `json:"check_interval_minutes"`
	FailureThreshold     int                           `json:"failure_threshold"`
	RecoveryEnabled      bool                          `json:"recovery_enabled"`
	WebhookConfigured    bool                          `json:"webhook_configured"`
	WebhookMasked        string                        `json:"webhook_masked"`
	Environment          string                        `json:"environment"`
	LastDelivery         model.ChannelHealthAlertState `json:"last_delivery"`
}

func maskWeComWebhookURL(webhookURL string) string {
	parsedURL, err := url.Parse(webhookURL)
	if err != nil {
		return ""
	}
	key := parsedURL.Query().Get("key")
	if len(key) <= 6 {
		return "••••••"
	}
	return "••••••" + key[len(key)-6:]
}

func getChannelHealthAlertConfigResponse() (channelHealthAlertConfigResponse, error) {
	setting := operation_setting.GetChannelHealthAlertSetting()
	state, err := model.GetChannelHealthAlertState()
	if err != nil {
		return channelHealthAlertConfigResponse{}, err
	}
	webhookURL := strings.TrimSpace(setting.WeComWebhookURL)
	return channelHealthAlertConfigResponse{
		Enabled:              setting.Enabled,
		CheckIntervalMinutes: setting.CheckIntervalMinutes,
		FailureThreshold:     setting.FailureThreshold,
		RecoveryEnabled:      setting.RecoveryEnabled,
		WebhookConfigured:    webhookURL != "",
		WebhookMasked:        maskWeComWebhookURL(webhookURL),
		Environment:          setting.Environment,
		LastDelivery:         state,
	}, nil
}

func GetChannelHealthAlertConfig(c *gin.Context) {
	response, err := getChannelHealthAlertConfigResponse()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, response)
}

func UpdateChannelHealthAlertConfig(c *gin.Context) {
	var req channelHealthAlertConfigRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "invalid channel health alert settings")
		return
	}
	if _, ok := channelHealthAlertIntervals[req.CheckIntervalMinutes]; !ok {
		common.ApiErrorMsg(c, "check interval must be 1, 2, 5, or 10 minutes")
		return
	}
	if req.FailureThreshold < 2 || req.FailureThreshold > 10 {
		common.ApiErrorMsg(c, "failure threshold must be between 2 and 10")
		return
	}
	environment := strings.TrimSpace(req.Environment)
	if environment == "" || utf8.RuneCountInString(environment) > 64 {
		common.ApiErrorMsg(c, "environment name must contain 1 to 64 characters")
		return
	}

	current := operation_setting.GetChannelHealthAlertSetting()
	webhookURL := strings.TrimSpace(req.WeComWebhookURL)
	if req.ClearWebhook {
		webhookURL = ""
	} else if webhookURL == "" {
		webhookURL = strings.TrimSpace(current.WeComWebhookURL)
	}
	if webhookURL != "" {
		if err := service.ValidateWeComWebhookURL(webhookURL); err != nil {
			common.ApiErrorMsg(c, err.Error())
			return
		}
	}
	if req.Enabled && webhookURL == "" {
		common.ApiErrorMsg(c, "enterprise WeChat webhook is required when alerts are enabled")
		return
	}

	values := map[string]string{
		"channel_health_alert_setting.enabled":                common.Interface2String(req.Enabled),
		"channel_health_alert_setting.check_interval_minutes": common.Interface2String(req.CheckIntervalMinutes),
		"channel_health_alert_setting.failure_threshold":      common.Interface2String(req.FailureThreshold),
		"channel_health_alert_setting.recovery_enabled":       common.Interface2String(req.RecoveryEnabled),
		"channel_health_alert_setting.wecom_webhook_url":      webhookURL,
		"channel_health_alert_setting.environment":            environment,
	}
	if err := model.UpdateOptionsBulk(values); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "channel_health_alert.update", map[string]interface{}{
		"enabled":                req.Enabled,
		"check_interval_minutes": req.CheckIntervalMinutes,
		"failure_threshold":      req.FailureThreshold,
		"recovery_enabled":       req.RecoveryEnabled,
		"webhook_configured":     webhookURL != "",
		"environment":            environment,
	})
	response, err := getChannelHealthAlertConfigResponse()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, response)
}

func TestChannelHealthAlert(c *gin.Context) {
	var req channelHealthAlertTestRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "invalid channel health alert test request")
		return
	}
	setting := operation_setting.GetChannelHealthAlertSetting()
	webhookURL := strings.TrimSpace(req.WeComWebhookURL)
	if webhookURL == "" {
		webhookURL = strings.TrimSpace(setting.WeComWebhookURL)
	}
	if err := service.ValidateWeComWebhookURL(webhookURL); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	environment := strings.TrimSpace(req.Environment)
	if environment == "" {
		environment = setting.Environment
	}
	if utf8.RuneCountInString(environment) > 64 {
		common.ApiErrorMsg(c, "environment name must contain at most 64 characters")
		return
	}
	if err := service.SendChannelHealthTestAlert(c.Request.Context(), webhookURL, environment); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	recordManageAudit(c, "channel_health_alert.test", map[string]interface{}{
		"environment": environment,
	})
	common.ApiSuccess(c, nil)
}
