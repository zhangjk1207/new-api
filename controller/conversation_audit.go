package controller

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	conversationaudit "github.com/QuantumNous/new-api/service/conversation_audit"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ListConversationAudits(c *gin.Context) {
	startAt, err := parseConversationAuditTime(c.Query("start_at"))
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	endAt, err := parseConversationAuditTime(c.Query("end_at"))
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	filter := conversationaudit.ListFilter{
		Page:           parseConversationAuditPositiveInt(c.Query("page")),
		PageSize:       parseConversationAuditPositiveInt(c.Query("page_size")),
		StartAt:        startAt,
		EndAt:          endAt,
		Username:       strings.TrimSpace(c.Query("username")),
		TokenName:      strings.TrimSpace(c.Query("token_name")),
		ModelName:      strings.TrimSpace(c.Query("model_name")),
		ConversationID: strings.TrimSpace(c.Query("conversation_id")),
		ClientIP:       strings.TrimSpace(c.Query("client_ip")),
	}
	if completed := strings.TrimSpace(c.Query("completed")); completed != "" {
		value, parseErr := strconv.ParseBool(completed)
		if parseErr != nil {
			common.ApiErrorMsg(c, "completed must be true or false")
			return
		}
		filter.Completed = &value
	}
	result, err := conversationaudit.List(filter)
	if err != nil {
		writeConversationAuditError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GetConversationAudit(c *gin.Context) {
	requestID := strings.TrimSpace(c.Param("request_id"))
	if requestID == "" {
		common.ApiErrorMsg(c, "request ID is required")
		return
	}
	turn, payload, err := conversationaudit.Get(requestID)
	if err != nil {
		writeConversationAuditError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"turn": turn, "payload": payload})
}

func parseConversationAuditTime(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}, fmt.Errorf("time must use RFC3339 format")
	}
	return parsed, nil
}

func parseConversationAuditPositiveInt(value string) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || parsed < 1 {
		return 0
	}
	return parsed
}

func writeConversationAuditError(c *gin.Context, err error) {
	if errors.Is(err, conversationaudit.ErrDisabled) {
		common.ApiErrorMsg(c, "conversation audit storage is not configured")
		return
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		common.ApiErrorMsg(c, "conversation audit record not found")
		return
	}
	common.ApiError(c, err)
}
