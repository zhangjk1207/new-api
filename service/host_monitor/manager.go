package hostmonitor

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const (
	collectionInterval = 30 * time.Second
	retentionPeriod    = 7 * 24 * time.Hour
)

var collectionInProgress atomic.Bool

func Init() {
	if !common.IsMasterNode {
		return
	}
	go func() {
		RunCollectionOnce()
		ticker := time.NewTicker(collectionInterval)
		defer ticker.Stop()
		for range ticker.C {
			RunCollectionOnce()
		}
	}()
}

func RunCollectionOnce() {
	if !collectionInProgress.CompareAndSwap(false, true) {
		return
	}
	defer collectionInProgress.Store(false)

	hosts, err := model.ListHostMonitors()
	if err != nil {
		common.SysError(fmt.Sprintf("list host monitors failed: %v", err))
		return
	}
	var wg sync.WaitGroup
	for _, host := range hosts {
		if !host.Enabled {
			continue
		}
		wg.Add(1)
		go func(host model.HostMonitor) {
			defer wg.Done()
			collectAndStore(host, time.Now())
		}(host)
	}
	wg.Wait()
	if err := model.DeleteHostMetricSamplesBefore(time.Now().Add(-retentionPeriod).Unix()); err != nil {
		common.SysError(fmt.Sprintf("clean host metric samples failed: %v", err))
	}
}

func CollectAndStore(host model.HostMonitor, now time.Time) (*model.HostMetricSample, error) {
	return collectAndStore(host, now)
}

func collectAndStore(host model.HostMonitor, now time.Time) (*model.HostMetricSample, error) {
	sample := &model.HostMetricSample{HostMonitorID: host.Id, CollectedAt: now.Unix()}
	snapshot, err := CollectHost(host)
	if err != nil {
		sample.ErrorMessage = err.Error()
		if saveErr := model.CreateHostMetricSample(sample); saveErr != nil {
			return sample, saveErr
		}
		return sample, err
	}
	gpuJSON, err := common.Marshal(snapshot.GPUs)
	if err != nil {
		return sample, err
	}
	sample.Online = true
	sample.CPUPercent = snapshot.CPUPercent
	sample.MemoryTotalBytes = snapshot.MemoryTotalBytes
	sample.MemoryUsedBytes = snapshot.MemoryUsedBytes
	sample.GPUsJSON = string(gpuJSON)
	if err := model.CreateHostMetricSample(sample); err != nil {
		return sample, err
	}
	return sample, nil
}
