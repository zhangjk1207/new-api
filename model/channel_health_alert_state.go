package model

import "gorm.io/gorm/clause"

const channelHealthAlertStateID = 1

type ChannelHealthAlertState struct {
	ID            int    `json:"-" gorm:"primaryKey"`
	LastAttemptAt int64  `json:"last_attempt_at" gorm:"bigint;not null"`
	LastSuccess   bool   `json:"last_success" gorm:"not null"`
	LastError     string `json:"last_error" gorm:"type:text"`
	LastEventType string `json:"last_event_type" gorm:"type:varchar(32)"`
}

func GetChannelHealthAlertState() (ChannelHealthAlertState, error) {
	var state ChannelHealthAlertState
	result := DB.Where("id = ?", channelHealthAlertStateID).Limit(1).Find(&state)
	if result.Error != nil {
		return ChannelHealthAlertState{}, result.Error
	}
	if result.RowsAffected == 0 {
		return ChannelHealthAlertState{ID: channelHealthAlertStateID}, nil
	}
	return state, nil
}

func SaveChannelHealthAlertState(state ChannelHealthAlertState) error {
	state.ID = channelHealthAlertStateID
	return DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		UpdateAll: true,
	}).Create(&state).Error
}
