package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSaveChannelHealthAlertStateReplacesSingleton(t *testing.T) {
	setupHostMonitorTestDB(t)
	require.NoError(t, DB.AutoMigrate(&ChannelHealthAlertState{}))

	require.NoError(t, SaveChannelHealthAlertState(ChannelHealthAlertState{
		LastAttemptAt: 10,
		LastSuccess:   false,
		LastError:     "timeout",
		LastEventType: "channel_transition",
	}))
	require.NoError(t, SaveChannelHealthAlertState(ChannelHealthAlertState{
		LastAttemptAt: 20,
		LastSuccess:   true,
		LastEventType: "test",
	}))

	state, err := GetChannelHealthAlertState()
	require.NoError(t, err)
	assert.Equal(t, int64(20), state.LastAttemptAt)
	assert.True(t, state.LastSuccess)
	assert.Empty(t, state.LastError)
	assert.Equal(t, "test", state.LastEventType)
}
