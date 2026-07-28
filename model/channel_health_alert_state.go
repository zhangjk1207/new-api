package model

import (
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

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
	err := DB.First(&state, channelHealthAlertStateID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ChannelHealthAlertState{ID: channelHealthAlertStateID}, nil
	}
	return state, err
}

func SaveChannelHealthAlertState(state ChannelHealthAlertState) error {
	state.ID = channelHealthAlertStateID
	return DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		UpdateAll: true,
	}).Create(&state).Error
}
