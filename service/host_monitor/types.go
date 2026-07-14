package hostmonitor

type GPUMetric struct {
	Index              int     `json:"index"`
	Name               string  `json:"name"`
	UUID               string  `json:"uuid"`
	UtilizationPercent float64 `json:"utilization_percent"`
	MemoryUsedBytes    int64   `json:"memory_used_bytes"`
	MemoryTotalBytes   int64   `json:"memory_total_bytes"`
	TemperatureC       float64 `json:"temperature_c"`
	PowerWatts         float64 `json:"power_watts"`
}

type Snapshot struct {
	CPUPercent       float64     `json:"cpu_percent"`
	MemoryTotalBytes int64       `json:"memory_total_bytes"`
	MemoryUsedBytes  int64       `json:"memory_used_bytes"`
	GPUs             []GPUMetric `json:"gpus"`
}
