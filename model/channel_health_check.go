package model

type ChannelHealthCheck struct {
	ID              int64    `json:"id" gorm:"primaryKey"`
	ChannelID       int      `json:"channel_id" gorm:"not null;index:idx_channel_health_checked,priority:1"`
	Status          int      `json:"status" gorm:"not null"`
	ResponseTime    int      `json:"response_time" gorm:"not null"`
	TokensPerSecond *float64 `json:"tokens_per_second,omitempty"`
	MaxConcurrency  *int     `json:"max_concurrency,omitempty"`
	CheckedAt       int64    `json:"checked_at" gorm:"not null;index:idx_channel_health_checked,priority:2"`
}

func ListChannelHealthChecksSince(channelIDs []int, since int64) ([]ChannelHealthCheck, error) {
	checks := make([]ChannelHealthCheck, 0)
	if len(channelIDs) == 0 {
		return checks, nil
	}
	err := DB.Where("channel_id IN ? AND checked_at >= ?", channelIDs, since).
		Order("checked_at asc").
		Find(&checks).Error
	return checks, err
}

func CreateChannelHealthChecks(checks []ChannelHealthCheck) error {
	if len(checks) == 0 {
		return nil
	}
	return DB.Create(&checks).Error
}

func DeleteChannelHealthChecksBefore(timestamp int64) error {
	return DB.Where("checked_at < ?", timestamp).Delete(&ChannelHealthCheck{}).Error
}
