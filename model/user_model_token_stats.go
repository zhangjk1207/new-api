package model

import "sort"

// UserModelTokenStatsFilter scopes dashboard token analytics to consumption logs.
type UserModelTokenStatsFilter struct {
	StartTime int64
	EndTime   int64
	Username  string
	TokenName string
	ModelName string
}

// UserModelTokenStat is the hourly token usage for one user, API key, and model.
// It is sourced from consumption logs because quota_data does not retain the
// input/output token split or API key name.
type UserModelTokenStat struct {
	UserID           int    `json:"user_id" gorm:"column:user_id"`
	Username         string `json:"username" gorm:"column:username"`
	TokenID          int    `json:"token_id" gorm:"column:token_id"`
	TokenName        string `json:"token_name" gorm:"column:token_name"`
	ModelName        string `json:"model_name" gorm:"column:model_name"`
	CreatedAt        int64  `json:"created_at" gorm:"column:created_at"`
	PromptTokens     int    `json:"prompt_tokens" gorm:"column:prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens" gorm:"column:completion_tokens"`
	TokenUsed        int    `json:"token_used" gorm:"column:token_used"`
	Count            int    `json:"count" gorm:"column:count"`
}

func GetUserModelTokenStats(filter UserModelTokenStatsFilter) ([]*UserModelTokenStat, error) {
	logs := make([]Log, 0)
	query := LOG_DB.Table("logs").
		Select("user_id, username, token_id, token_name, model_name, created_at, prompt_tokens, completion_tokens").
		Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeConsume, filter.StartTime, filter.EndTime)
	if filter.Username != "" {
		query = query.Where("username = ?", filter.Username)
	}
	if filter.TokenName != "" {
		query = query.Where("token_name = ?", filter.TokenName)
	}
	if filter.ModelName != "" {
		query = query.Where("model_name = ?", filter.ModelName)
	}
	if err := query.Order("created_at ASC").Find(&logs).Error; err != nil {
		return nil, err
	}

	type statKey struct {
		userID    int
		username  string
		tokenID   int
		tokenName string
		modelName string
		createdAt int64
	}
	statsByKey := make(map[statKey]*UserModelTokenStat)
	for _, log := range logs {
		key := statKey{
			userID:    log.UserId,
			username:  log.Username,
			tokenID:   log.TokenId,
			tokenName: log.TokenName,
			modelName: log.ModelName,
			createdAt: log.CreatedAt / 3600 * 3600,
		}
		stat := statsByKey[key]
		if stat == nil {
			stat = &UserModelTokenStat{
				UserID:    key.userID,
				Username:  key.username,
				TokenID:   key.tokenID,
				TokenName: key.tokenName,
				ModelName: key.modelName,
				CreatedAt: key.createdAt,
			}
			statsByKey[key] = stat
		}
		stat.PromptTokens += log.PromptTokens
		stat.CompletionTokens += log.CompletionTokens
		stat.TokenUsed = stat.PromptTokens + stat.CompletionTokens
		stat.Count++
	}

	stats := make([]*UserModelTokenStat, 0, len(statsByKey))
	for _, stat := range statsByKey {
		stats = append(stats, stat)
	}
	sort.Slice(stats, func(i int, j int) bool {
		if stats[i].CreatedAt != stats[j].CreatedAt {
			return stats[i].CreatedAt < stats[j].CreatedAt
		}
		if stats[i].Username != stats[j].Username {
			return stats[i].Username < stats[j].Username
		}
		if stats[i].TokenName != stats[j].TokenName {
			return stats[i].TokenName < stats[j].TokenName
		}
		return stats[i].ModelName < stats[j].ModelName
	})
	return stats, nil
}
