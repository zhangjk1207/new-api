package conversationaudit

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSplitRequestPayloadSeparatesMessagesAndConversationID(t *testing.T) {
	params, messages, conversationID, err := splitRequestPayload([]byte(`{
  "model":"dataspace-31b",
  "temperature":0.7,
  "conversation_id":"project-42",
  "messages":[
    {"role":"system","content":"You are concise."},
    {"role":"user","content":"Summarize this."}
  ]
}`))

	require.NoError(t, err)
	assert.Equal(t, "project-42", conversationID)
	assert.JSONEq(t, `{"model":"dataspace-31b","temperature":0.7,"conversation_id":"project-42"}`, params)
	assert.JSONEq(t, `[{"role":"system","content":"You are concise."},{"role":"user","content":"Summarize this."}]`, messages)
}

func TestExtractResponseContentCombinesStreamDeltas(t *testing.T) {
	content, reasoning := extractResponseContent([]byte("data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\ndata: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\n\ndata: [DONE]\n\n"))

	assert.Equal(t, "Hello world", content)
	assert.Empty(t, reasoning)
}

func TestExtractResponseContentKeepsPartialStreamOutput(t *testing.T) {
	content, reasoning := extractResponseContent([]byte("data: {\"choices\":[{\"delta\":{\"content\":\"Partial answer\"}}]}\n\n"))

	assert.Equal(t, "Partial answer", content)
	assert.Empty(t, reasoning)
}

func TestExtractResponseContentSeparatesReasoningDeltas(t *testing.T) {
	content, reasoning := extractResponseContent([]byte("data: {\"choices\":[{\"delta\":{\"reasoning_content\":\"Think. \"}}]}\n\ndata: {\"choices\":[{\"delta\":{\"reasoning_content\":\"Then answer.\",\"content\":\"Done\"}}]}\n\n"))

	assert.Equal(t, "Done", content)
	assert.Equal(t, "Think. Then answer.", reasoning)
}

func TestSplitRequestPayloadKeepsResponsesInput(t *testing.T) {
	params, messages, _, err := splitRequestPayload([]byte(`{
  "model":"dataspace-31b",
  "input":[{"role":"user","content":"Explain this"}],
  "max_output_tokens":512
}`))

	require.NoError(t, err)
	assert.JSONEq(t, `{"model":"dataspace-31b","max_output_tokens":512}`, params)
	var input []map[string]any
	require.NoError(t, common.Unmarshal([]byte(messages), &input))
	require.Len(t, input, 1)
	assert.Equal(t, "Explain this", input[0]["content"])
}
