package model

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupHostMonitorTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	require.NoError(t, db.AutoMigrate(&HostMonitor{}, &HostMetricSample{}))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
	return db
}

func TestHostMonitorMetricHistoryAndRetention(t *testing.T) {
	setupHostMonitorTestDB(t)
	host := &HostMonitor{Name: "gpu-node", Address: "172.16.0.72", Port: 22, Username: "monitor", PrivateKeyEncrypted: "encrypted", Enabled: true}
	require.NoError(t, CreateHostMonitor(host))

	now := time.Now().Unix()
	require.NoError(t, CreateHostMetricSample(&HostMetricSample{HostMonitorID: host.Id, Online: true, CPUPercent: 32.5, MemoryTotalBytes: 64, MemoryUsedBytes: 16, CollectedAt: now - 60}))
	require.NoError(t, CreateHostMetricSample(&HostMetricSample{HostMonitorID: host.Id, Online: true, CPUPercent: 48.5, MemoryTotalBytes: 64, MemoryUsedBytes: 32, CollectedAt: now}))

	history, err := ListHostMetricSamplesSince([]int{host.Id}, now-120)
	require.NoError(t, err)
	require.Len(t, history, 2)
	assert.Equal(t, now-60, history[0].CollectedAt)
	assert.Equal(t, now, history[1].CollectedAt)

	require.NoError(t, DeleteHostMetricSamplesBefore(now-30))
	history, err = ListHostMetricSamplesSince([]int{host.Id}, now-120)
	require.NoError(t, err)
	require.Len(t, history, 1)
	assert.Equal(t, now, history[0].CollectedAt)
}

func TestDeleteHostMonitorRemovesItsMetricSamples(t *testing.T) {
	setupHostMonitorTestDB(t)
	host := &HostMonitor{Name: "gpu-node", Address: "172.16.0.72", Port: 22, Username: "monitor", PrivateKeyEncrypted: "encrypted", Enabled: true}
	require.NoError(t, CreateHostMonitor(host))
	require.NoError(t, CreateHostMetricSample(&HostMetricSample{HostMonitorID: host.Id, Online: true, CollectedAt: time.Now().Unix()}))

	require.NoError(t, DeleteHostMonitor(host.Id))

	var samples []HostMetricSample
	require.NoError(t, DB.Find(&samples).Error)
	assert.Empty(t, samples)
}
