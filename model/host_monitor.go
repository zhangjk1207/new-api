package model

import (
	"time"

	"gorm.io/gorm"
)

type HostMonitor struct {
	Id                  int       `json:"id" gorm:"primaryKey"`
	Name                string    `json:"name" gorm:"type:varchar(128);uniqueIndex;not null"`
	Address             string    `json:"address" gorm:"type:varchar(255);not null"`
	Port                int       `json:"port" gorm:"not null"`
	Username            string    `json:"username" gorm:"type:varchar(128);not null"`
	PrivateKeyEncrypted string    `json:"-" gorm:"type:text;not null"`
	Enabled             bool      `json:"enabled" gorm:"not null"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func (HostMonitor) TableName() string {
	return "host_monitors"
}

type HostMetricSample struct {
	Id               int     `json:"id" gorm:"primaryKey"`
	HostMonitorID    int     `json:"host_monitor_id" gorm:"not null;index:idx_host_metric_collected,priority:1"`
	Online           bool    `json:"online" gorm:"not null"`
	CPUPercent       float64 `json:"cpu_percent" gorm:"not null"`
	MemoryTotalBytes int64   `json:"memory_total_bytes" gorm:"not null"`
	MemoryUsedBytes  int64   `json:"memory_used_bytes" gorm:"not null"`
	GPUsJSON         string  `json:"-" gorm:"type:text"`
	ErrorMessage     string  `json:"-" gorm:"type:text"`
	CollectedAt      int64   `json:"collected_at" gorm:"not null;index:idx_host_metric_collected,priority:2"`
}

func (HostMetricSample) TableName() string {
	return "host_metric_samples"
}

func ListHostMonitors() ([]HostMonitor, error) {
	hosts := make([]HostMonitor, 0)
	err := DB.Order("id ASC").Find(&hosts).Error
	return hosts, err
}

func GetHostMonitorByID(id int) (*HostMonitor, error) {
	var host HostMonitor
	if err := DB.First(&host, id).Error; err != nil {
		return nil, err
	}
	return &host, nil
}

func CreateHostMonitor(host *HostMonitor) error {
	return DB.Create(host).Error
}

func UpdateHostMonitor(host *HostMonitor) error {
	return DB.Save(host).Error
}

func DeleteHostMonitor(id int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("host_monitor_id = ?", id).Delete(&HostMetricSample{}).Error; err != nil {
			return err
		}
		return tx.Delete(&HostMonitor{}, id).Error
	})
}

func CreateHostMetricSample(sample *HostMetricSample) error {
	return DB.Create(sample).Error
}

func ListHostMetricSamplesSince(hostIDs []int, since int64) ([]HostMetricSample, error) {
	samples := make([]HostMetricSample, 0)
	if len(hostIDs) == 0 {
		return samples, nil
	}
	err := DB.Where("host_monitor_id IN ? AND collected_at >= ?", hostIDs, since).
		Order("collected_at ASC").
		Find(&samples).Error
	return samples, err
}

func DeleteHostMetricSamplesBefore(timestamp int64) error {
	if timestamp <= 0 {
		return nil
	}
	return DB.Where("collected_at < ?", timestamp).Delete(&HostMetricSample{}).Error
}
