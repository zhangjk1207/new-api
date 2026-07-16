package conversationaudit

import (
	"net/http/httptest"
	"testing"
	"time"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCaptureBuildsOnePartialStreamRecord(t *testing.T) {
	capture := &Capture{
		requestID:      "request-1",
		conversationID: "conversation-1",
		requestParams:  `{"model":"dataspace-31b"}`,
		messages:       `[{"role":"user","content":"hello"}]`,
		startedAt:      time.Now().Add(-2 * time.Second),
		username:       "alice",
		tokenName:      "team-token",
		channelName:    "vllm-a",
		clientIP:       "203.0.113.17",
	}
	capture.AppendResponse([]byte("data: {\"choices\":[{\"delta\":{\"content\":\"partial\"}}]}\n\n"))

	record := capture.buildRecord(&relaycommon.RelayInfo{
		RequestId:       "request-1",
		UserId:          7,
		TokenId:         9,
		OriginModelName: "dataspace-31b",
		IsStream:        true,
		ChannelMeta:     &relaycommon.ChannelMeta{ChannelId: 12},
		StreamStatus:    &relaycommon.StreamStatus{EndReason: relaycommon.StreamEndReasonClientGone},
	}, 200, "")

	assert.Equal(t, "partial", record.payload.ResponseContent)
	assert.Empty(t, record.payload.ReasoningContent)
	assert.Equal(t, "client_gone", record.turn.EndReason)
	assert.EqualValues(t, 0, record.turn.Completed)
	assert.Equal(t, "conversation-1", record.turn.ConversationID)
	assert.Equal(t, "alice", record.turn.Username)
	assert.Equal(t, "203.0.113.17", record.turn.ClientIP)
}

func TestWrapResponseWriterCapturesEveryResponseWrite(t *testing.T) {
	gin.SetMode(gin.TestMode)
	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	capture := &Capture{}
	context.Writer = WrapResponseWriter(context.Writer, capture)

	_, err := context.Writer.WriteString("data: first\n\n")
	assert.NoError(t, err)
	_, err = context.Writer.Write([]byte("data: second\n\n"))
	assert.NoError(t, err)

	capture.responseMu.Lock()
	defer capture.responseMu.Unlock()
	assert.Equal(t, "data: first\n\ndata: second\n\n", capture.response.String())
}
