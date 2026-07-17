package conversationaudit

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
)

// splitRequestPayload keeps request options separate from the conversational input.
// The original JSON is only retained as structured values and never includes headers.
func splitRequestPayload(body []byte) (params string, messages string, conversationID string, err error) {
	request := make(map[string]any)
	if err = common.Unmarshal(body, &request); err != nil {
		return "", "", "", err
	}

	conversationID = stringValue(request["conversation_id"])
	if conversationID == "" {
		conversationID = stringValue(nestedValue(request, "metadata", "conversation_id"))
	}

	messagesValue := any([]any{})
	for _, key := range []string{"messages", "input", "contents"} {
		if value, ok := request[key]; ok {
			messagesValue = value
			delete(request, key)
			break
		}
	}

	paramsJSON, err := common.Marshal(request)
	if err != nil {
		return "", "", "", err
	}
	messagesJSON, err := common.Marshal(messagesValue)
	if err != nil {
		return "", "", "", err
	}
	return string(paramsJSON), string(messagesJSON), conversationID, nil
}

// extractResponseContent separates answer text from model reasoning after a
// stream completes. The raw SSE framing is intentionally discarded.
func extractResponseContent(raw []byte) (content string, reasoning string) {
	var contentBuilder strings.Builder
	var reasoningBuilder strings.Builder
	for _, event := range strings.Split(string(raw), "\n") {
		event = strings.TrimSpace(event)
		if event == "" || event == "data: [DONE]" || event == "[DONE]" {
			continue
		}
		if strings.HasPrefix(event, "data:") {
			event = strings.TrimSpace(strings.TrimPrefix(event, "data:"))
		}
		appendResponseText(&contentBuilder, &reasoningBuilder, event)
	}
	return contentBuilder.String(), reasoningBuilder.String()
}

func appendResponseText(contentBuilder *strings.Builder, reasoningBuilder *strings.Builder, rawEvent string) {
	payload := make(map[string]any)
	if common.UnmarshalJsonStr(rawEvent, &payload) != nil {
		return
	}

	for _, choice := range sliceValue(payload["choices"]) {
		choiceMap := mapValue(choice)
		appendTextValue(reasoningBuilder, nestedValue(choiceMap, "delta", "reasoning_content"))
		appendTextValue(reasoningBuilder, nestedValue(choiceMap, "delta", "reasoning"))
		appendTextValue(reasoningBuilder, nestedValue(choiceMap, "message", "reasoning_content"))
		appendTextValue(reasoningBuilder, nestedValue(choiceMap, "message", "reasoning"))
		appendTextValue(contentBuilder, nestedValue(choiceMap, "delta", "content"))
		appendTextValue(contentBuilder, nestedValue(choiceMap, "message", "content"))
	}

	for _, output := range sliceValue(payload["output"]) {
		outputMap := mapValue(output)
		for _, block := range sliceValue(outputMap["content"]) {
			blockMap := mapValue(block)
			if stringValue(blockMap["type"]) == "reasoning" {
				appendTextValue(reasoningBuilder, blockMap["text"])
				continue
			}
			appendTextValue(contentBuilder, blockMap["text"])
		}
	}

	for _, candidate := range sliceValue(payload["candidates"]) {
		candidateMap := mapValue(candidate)
		for _, part := range sliceValue(nestedValue(candidateMap, "content", "parts")) {
			partMap := mapValue(part)
			if thought, _ := partMap["thought"].(bool); thought {
				appendTextValue(reasoningBuilder, partMap["text"])
				continue
			}
			appendTextValue(contentBuilder, partMap["text"])
		}
	}

	eventType := stringValue(payload["type"])
	if eventType == "response.reasoning_text.delta" {
		appendTextValue(reasoningBuilder, payload["delta"])
	} else if eventType == "response.output_text.delta" {
		appendTextValue(contentBuilder, payload["delta"])
	}
	appendTextValue(reasoningBuilder, nestedValue(payload, "delta", "thinking"))
	appendTextValue(reasoningBuilder, nestedValue(payload, "delta", "reasoning_content"))
	appendTextValue(reasoningBuilder, nestedValue(payload, "delta", "reasoning"))
	appendTextValue(contentBuilder, nestedValue(payload, "delta", "text"))
}

func appendTextValue(builder *strings.Builder, value any) {
	switch typed := value.(type) {
	case string:
		builder.WriteString(typed)
	case []any:
		for _, item := range typed {
			itemMap := mapValue(item)
			appendTextValue(builder, itemMap["text"])
			appendTextValue(builder, itemMap["content"])
		}
	case map[string]any:
		appendTextValue(builder, typed["text"])
	}
}

func nestedValue(value map[string]any, keys ...string) any {
	var current any = value
	for _, key := range keys {
		current = mapValue(current)[key]
	}
	return current
}

func mapValue(value any) map[string]any {
	if mapped, ok := value.(map[string]any); ok {
		return mapped
	}
	return map[string]any{}
}

func sliceValue(value any) []any {
	if values, ok := value.([]any); ok {
		return values
	}
	return nil
}

func stringValue(value any) string {
	if result, ok := value.(string); ok {
		return result
	}
	return ""
}
