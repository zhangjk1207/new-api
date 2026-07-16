package conversationaudit

import (
	"bytes"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"

	"github.com/gin-gonic/gin"
)

type Capture struct {
	info *relaycommon.RelayInfo

	requestID      string
	conversationID string
	requestParams  string
	messages       string
	startedAt      time.Time
	username       string
	tokenName      string
	channelName    string
	clientIP       string

	responseMu sync.Mutex
	response   bytes.Buffer
}

type responseWriter struct {
	gin.ResponseWriter
	capture *Capture
}

// Start prepares an in-memory capture for a conversational relay. It is a
// no-op unless the dedicated ClickHouse store has initialized successfully.
func Start(c *gin.Context, info *relaycommon.RelayInfo) *Capture {
	if !enabled() || !isConversationRelay(info.RelayMode) {
		return nil
	}

	storage, err := common.GetBodyStorage(c)
	if err != nil {
		common.SysError("read conversation audit request body: " + err.Error())
		return nil
	}
	body, err := storage.Bytes()
	if err != nil {
		common.SysError("read conversation audit request payload: " + err.Error())
		return nil
	}
	params, messages, conversationID, err := splitRequestPayload(body)
	if err != nil {
		common.SysError("parse conversation audit request payload: " + err.Error())
		return nil
	}
	if conversationID == "" {
		conversationID = strings.TrimSpace(c.GetHeader("X-ZhiQing-Conversation-ID"))
	}
	if conversationID == "" {
		conversationID = info.RequestId
	}

	return &Capture{
		info:           info,
		requestID:      info.RequestId,
		conversationID: conversationID,
		requestParams:  params,
		messages:       messages,
		startedAt:      info.StartTime,
		username:       common.GetContextKeyString(c, constant.ContextKeyUserName),
		tokenName:      c.GetString("token_name"),
		channelName:    common.GetContextKeyString(c, constant.ContextKeyChannelName),
		clientIP:       c.ClientIP(),
	}
}

func (capture *Capture) AppendResponse(data []byte) {
	if capture == nil || len(data) == 0 {
		return
	}
	capture.responseMu.Lock()
	defer capture.responseMu.Unlock()
	_, _ = capture.response.Write(data)
}

// WrapResponseWriter observes the exact client response without changing any
// relay adapter or stream framing behavior.
func WrapResponseWriter(writer gin.ResponseWriter, capture *Capture) gin.ResponseWriter {
	if capture == nil {
		return writer
	}
	return &responseWriter{ResponseWriter: writer, capture: capture}
}

func (writer *responseWriter) Write(data []byte) (int, error) {
	writer.capture.AppendResponse(data)
	return writer.ResponseWriter.Write(data)
}

func (writer *responseWriter) WriteString(value string) (int, error) {
	writer.capture.AppendResponse([]byte(value))
	return writer.ResponseWriter.WriteString(value)
}

// Finalize queues one complete turn after the relay has emitted its final
// response. A client-disconnected stream therefore keeps the generated prefix.
func (capture *Capture) Finalize(statusCode int, relayError string) {
	if capture == nil || capture.info == nil {
		return
	}
	enqueue(capture.buildRecord(capture.info, statusCode, relayError))
}

func (capture *Capture) buildRecord(info *relaycommon.RelayInfo, statusCode int, relayError string) record {
	capture.responseMu.Lock()
	rawResponse := append([]byte(nil), capture.response.Bytes()...)
	capture.responseMu.Unlock()
	responseContent, reasoningContent := extractResponseContent(rawResponse)

	endReason := "done"
	endError := relayError
	completed := statusCode < 400 && relayError == ""
	if info.StreamStatus != nil {
		if info.StreamStatus.EndReason != "" {
			endReason = string(info.StreamStatus.EndReason)
		}
		if info.StreamStatus.EndError != nil {
			endError = info.StreamStatus.EndError.Error()
		}
		completed = completed && info.StreamStatus.IsNormalEnd()
	}

	channelID := 0
	if info.ChannelMeta != nil {
		channelID = info.ChannelId
	}
	firstResponseMS := int64(0)
	if info.HasSendResponse() {
		firstResponseMS = info.FirstResponseTime.Sub(capture.startedAt).Milliseconds()
	}

	return record{
		turn: turnRow{
			EventTime:       capture.startedAt,
			RequestID:       capture.requestID,
			ConversationID:  capture.conversationID,
			UserID:          info.UserId,
			Username:        capture.username,
			TokenID:         info.TokenId,
			TokenName:       capture.tokenName,
			ModelName:       info.OriginModelName,
			ChannelID:       channelID,
			ChannelName:     capture.channelName,
			ClientIP:        capture.clientIP,
			RequestPath:     info.RequestURLPath,
			IsStream:        boolToUInt8(info.IsStream),
			Completed:       boolToUInt8(completed),
			EndReason:       endReason,
			EndError:        endError,
			StatusCode:      uint16(max(statusCode, 0)),
			PromptTokens:    info.GetEstimatePromptTokens(),
			FirstResponseMS: firstResponseMS,
			DurationMS:      time.Since(capture.startedAt).Milliseconds(),
		},
		payload: payloadRow{
			RequestID:         capture.requestID,
			RequestParamsJSON: capture.requestParams,
			MessagesJSON:      capture.messages,
			ResponseContent:   responseContent,
			ReasoningContent:  reasoningContent,
		},
	}
}

func isConversationRelay(relayMode int) bool {
	switch relayMode {
	case relayconstant.RelayModeChatCompletions,
		relayconstant.RelayModeCompletions,
		relayconstant.RelayModeResponses,
		relayconstant.RelayModeResponsesCompact,
		relayconstant.RelayModeGemini:
		return true
	default:
		return false
	}
}

func boolToUInt8(value bool) uint8 {
	if value {
		return 1
	}
	return 0
}
