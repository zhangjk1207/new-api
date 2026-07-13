package model

// UserModelTokenStat is the hourly token usage for one user and model.
// It is sourced from quota_data so dashboard reads do not scan the log table.
type UserModelTokenStat struct {
	UserID    int    `json:"user_id" gorm:"column:user_id"`
	Username  string `json:"username" gorm:"column:username"`
	ModelName string `json:"model_name" gorm:"column:model_name"`
	CreatedAt int64  `json:"created_at" gorm:"column:created_at"`
	TokenUsed int    `json:"token_used" gorm:"column:token_used"`
	Count     int    `json:"count" gorm:"column:count"`
}

func GetUserModelTokenStats(startTime int64, endTime int64) ([]*UserModelTokenStat, error) {
	rows := make([]*UserModelTokenStat, 0)
	err := DB.Table("quota_data").
		Select("user_id, username, model_name, created_at, sum(token_used) as token_used, sum(count) as count").
		Where("created_at >= ? and created_at <= ?", startTime, endTime).
		Group("user_id, username, model_name, created_at").
		Order("created_at ASC, username ASC, model_name ASC").
		Find(&rows).Error
	return rows, err
}
