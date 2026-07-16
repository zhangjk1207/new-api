package conversationaudit

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

var ErrDisabled = errors.New("conversation audit storage is not configured")

type ListFilter struct {
	Page           int
	PageSize       int
	StartAt        time.Time
	EndAt          time.Time
	Username       string
	TokenName      string
	ModelName      string
	ConversationID string
	ClientIP       string
	Completed      *bool
}

type Turn struct {
	EventTime        time.Time `json:"event_time"`
	RequestID        string    `json:"request_id"`
	ConversationID   string    `json:"conversation_id"`
	UserID           int       `json:"user_id"`
	Username         string    `json:"username"`
	TokenID          int       `json:"token_id"`
	TokenName        string    `json:"token_name"`
	ModelName        string    `json:"model_name"`
	ChannelID        int       `json:"channel_id"`
	ChannelName      string    `json:"channel_name"`
	ClientIP         string    `json:"client_ip"`
	RequestPath      string    `json:"request_path"`
	IsStream         bool      `json:"is_stream"`
	Completed        bool      `json:"completed"`
	EndReason        string    `json:"end_reason"`
	EndError         string    `json:"end_error"`
	StatusCode       uint16    `json:"status_code"`
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int       `json:"completion_tokens"`
	FirstResponseMS  int64     `json:"first_response_ms"`
	DurationMS       int64     `json:"duration_ms"`
}

type Payload struct {
	RequestID         string `json:"request_id"`
	RequestParamsJSON string `json:"request_params_json"`
	MessagesJSON      string `json:"messages_json"`
	ResponseContent   string `json:"response_content"`
	ReasoningContent  string `json:"reasoning_content"`
}

type ListResult struct {
	Items []Turn `json:"items"`
	Total int64  `json:"total"`
}

func List(filter ListFilter) (ListResult, error) {
	current, ok := currentStore()
	if !ok {
		return ListResult{}, ErrDisabled
	}
	filter = normalizeListFilter(filter, time.Now())
	query := current.db.Table("conversation_turns").
		Where("event_time >= ? AND event_time <= ?", filter.StartAt, filter.EndAt)
	if filter.Username != "" {
		query = query.Where("username LIKE ?", "%"+filter.Username+"%")
	}
	if filter.TokenName != "" {
		query = query.Where("token_name LIKE ?", "%"+filter.TokenName+"%")
	}
	if filter.ModelName != "" {
		query = query.Where("model_name LIKE ?", "%"+filter.ModelName+"%")
	}
	if filter.ConversationID != "" {
		query = query.Where("conversation_id LIKE ?", "%"+filter.ConversationID+"%")
	}
	if filter.ClientIP != "" {
		query = query.Where("client_ip LIKE ?", "%"+filter.ClientIP+"%")
	}
	if filter.Completed != nil {
		query = query.Where("completed = ?", boolToUInt8(*filter.Completed))
	}

	result := ListResult{Items: make([]Turn, 0)}
	if err := query.Count(&result.Total).Error; err != nil {
		return ListResult{}, err
	}
	rows := make([]turnRow, 0)
	if err := query.Order("event_time DESC").
		Limit(filter.PageSize).
		Offset((filter.Page - 1) * filter.PageSize).
		Find(&rows).Error; err != nil {
		return ListResult{}, err
	}
	for _, row := range rows {
		result.Items = append(result.Items, turnFromRow(row))
	}
	return result, nil
}

func Get(requestID string) (Turn, Payload, error) {
	current, ok := currentStore()
	if !ok {
		return Turn{}, Payload{}, ErrDisabled
	}
	var row turnRow
	if err := current.db.Table("conversation_turns").
		Where("request_id = ?", strings.TrimSpace(requestID)).
		Order("event_time DESC").
		Limit(1).
		Find(&row).Error; err != nil {
		return Turn{}, Payload{}, err
	}
	if row.RequestID == "" {
		return Turn{}, Payload{}, gorm.ErrRecordNotFound
	}
	var payload Payload
	if err := current.db.Table("conversation_payloads").
		Where("request_id = ?", strings.TrimSpace(requestID)).
		Limit(1).
		Find(&payload).Error; err != nil {
		return Turn{}, Payload{}, err
	}
	return turnFromRow(row), payload, nil
}

func turnFromRow(row turnRow) Turn {
	return Turn{
		EventTime:        row.EventTime,
		RequestID:        row.RequestID,
		ConversationID:   row.ConversationID,
		UserID:           row.UserID,
		Username:         row.Username,
		TokenID:          row.TokenID,
		TokenName:        row.TokenName,
		ModelName:        row.ModelName,
		ChannelID:        row.ChannelID,
		ChannelName:      row.ChannelName,
		ClientIP:         row.ClientIP,
		RequestPath:      row.RequestPath,
		IsStream:         row.IsStream == 1,
		Completed:        row.Completed == 1,
		EndReason:        row.EndReason,
		EndError:         row.EndError,
		StatusCode:       row.StatusCode,
		PromptTokens:     row.PromptTokens,
		CompletionTokens: row.CompletionTokens,
		FirstResponseMS:  row.FirstResponseMS,
		DurationMS:       row.DurationMS,
	}
}

func currentStore() (*store, bool) {
	auditStore.RLock()
	defer auditStore.RUnlock()
	return auditStore.value, auditStore.value != nil
}

func normalizeListFilter(filter ListFilter, now time.Time) ListFilter {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}
	if filter.EndAt.IsZero() {
		filter.EndAt = now
	}
	if filter.StartAt.IsZero() {
		filter.StartAt = filter.EndAt.Add(-24 * time.Hour)
	}
	return filter
}
