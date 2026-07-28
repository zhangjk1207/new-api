package controller

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExtractModelEvaluationStreamingResponse(t *testing.T) {
	body := strings.Join([]string{
		`data: {"choices":[{"delta":{"reasoning_content":"think "}}]}`,
		`data: {"choices":[{"delta":{"content":"hello "}}]}`,
		`data: {"choices":[{"delta":{"content":"world"}}]}`,
		`data: [DONE]`,
	}, "\n")

	output, reasoning := extractModelEvaluationResponse([]byte(body))
	assert.Equal(t, "hello world", output)
	assert.Equal(t, "think ", reasoning)
}

func TestParseModelEvaluationJSONLRejectsInvalidLine(t *testing.T) {
	questions, err := parseModelEvaluationJSONL(strings.NewReader("{\"category\":\"logic\",\"prompt\":\"one\"}\ninvalid\n"))
	require.Error(t, err)
	assert.Nil(t, questions)
	assert.Contains(t, err.Error(), "line 2")
}
