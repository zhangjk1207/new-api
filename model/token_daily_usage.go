package model

import "time"

type TokenDailyUsage struct {
	Date               string `json:"date,omitempty"`
	InputTokens        int64  `json:"input_tokens"`
	OutputTokens       int64  `json:"output_tokens"`
	TotalTokens        int64  `json:"total_tokens"`
	SuccessfulRequests int64  `json:"successful_requests"`
}

func GetTokenDailyUsage(tokenId int, startDate time.Time, endDate time.Time) ([]TokenDailyUsage, error) {
	dayCount := int(endDate.Sub(startDate).Hours()/24) + 1
	daily := make([]TokenDailyUsage, dayCount)
	dayIndexes := make(map[string]int, dayCount)
	for i := range daily {
		date := startDate.AddDate(0, 0, i).Format(time.DateOnly)
		daily[i].Date = date
		dayIndexes[date] = i
	}

	type usageRow struct {
		CreatedAt        int64
		PromptTokens     int64
		CompletionTokens int64
	}
	rows, err := LOG_DB.Model(&Log{}).
		Select("created_at, prompt_tokens, completion_tokens").
		Where("token_id = ? AND type = ? AND created_at >= ? AND created_at < ?",
			tokenId, LogTypeConsume, startDate.Unix(), endDate.AddDate(0, 0, 1).Unix()).
		Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var row usageRow
		if err = LOG_DB.ScanRows(rows, &row); err != nil {
			return nil, err
		}
		date := time.Unix(row.CreatedAt, 0).In(startDate.Location()).Format(time.DateOnly)
		index, exists := dayIndexes[date]
		if !exists {
			continue
		}
		daily[index].InputTokens += row.PromptTokens
		daily[index].OutputTokens += row.CompletionTokens
		daily[index].TotalTokens += row.PromptTokens + row.CompletionTokens
		daily[index].SuccessfulRequests++
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return daily, nil
}
