package hostmonitor

import (
	"encoding/csv"
	"fmt"
	"net"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/model"
	"golang.org/x/crypto/ssh"
)

const collectionCommand = "LC_ALL=C sh -c 'head -n 1 /proc/stat; sleep 1; head -n 1 /proc/stat; grep -E \"^(MemTotal|MemAvailable):\" /proc/meminfo; printf \"__NEW_API_GPU__\\n\"; nvidia-smi --query-gpu=index,name,uuid,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw --format=csv,noheader,nounits 2>/dev/null || true'"

func ValidateHostInput(host model.HostMonitor, privateKey string, requirePrivateKey bool) error {
	if len(strings.TrimSpace(host.Name)) == 0 || len(strings.TrimSpace(host.Name)) > 128 {
		return fmt.Errorf("host name must contain 1 to 128 characters")
	}
	if !validHostAddress(host.Address) {
		return fmt.Errorf("host address must be an IP address or hostname")
	}
	if host.Port < 1 || host.Port > 65535 {
		return fmt.Errorf("SSH port must be between 1 and 65535")
	}
	if len(strings.TrimSpace(host.Username)) == 0 || len(strings.TrimSpace(host.Username)) > 128 {
		return fmt.Errorf("SSH username must contain 1 to 128 characters")
	}
	if requirePrivateKey && strings.TrimSpace(privateKey) == "" {
		return fmt.Errorf("SSH private key is required")
	}
	if strings.TrimSpace(privateKey) != "" {
		if _, err := ssh.ParsePrivateKey([]byte(privateKey)); err != nil {
			return fmt.Errorf("invalid SSH private key: %w", err)
		}
	}
	return nil
}

func validHostAddress(value string) bool {
	value = strings.TrimSpace(value)
	if net.ParseIP(value) != nil {
		return true
	}
	if len(value) == 0 || len(value) > 253 || strings.HasPrefix(value, ".") || strings.HasSuffix(value, ".") {
		return false
	}
	for _, label := range strings.Split(value, ".") {
		if len(label) == 0 || len(label) > 63 || strings.HasPrefix(label, "-") || strings.HasSuffix(label, "-") {
			return false
		}
		for _, r := range label {
			if (r < 'a' || r > 'z') && (r < 'A' || r > 'Z') && (r < '0' || r > '9') && r != '-' {
				return false
			}
		}
	}
	return true
}

func CollectHost(host model.HostMonitor) (Snapshot, error) {
	privateKey, err := DecryptPrivateKey(host.PrivateKeyEncrypted)
	if err != nil {
		return Snapshot{}, err
	}
	signer, err := ssh.ParsePrivateKey([]byte(privateKey))
	if err != nil {
		return Snapshot{}, fmt.Errorf("parse SSH private key: %w", err)
	}
	config := &ssh.ClientConfig{
		User:            host.Username,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}
	client, err := ssh.Dial("tcp", net.JoinHostPort(host.Address, strconv.Itoa(host.Port)), config)
	if err != nil {
		return Snapshot{}, fmt.Errorf("connect to SSH host: %w", err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return Snapshot{}, fmt.Errorf("create SSH session: %w", err)
	}
	defer session.Close()
	output, err := session.CombinedOutput(collectionCommand)
	if err != nil {
		return Snapshot{}, fmt.Errorf("collect host metrics: %w", err)
	}
	return ParseCollectionOutput(string(output))
}

func ParseCollectionOutput(output string) (Snapshot, error) {
	parts := strings.Split(strings.ReplaceAll(output, "\r\n", "\n"), "__NEW_API_GPU__\n")
	if len(parts) != 2 {
		return Snapshot{}, fmt.Errorf("host metric output is missing GPU separator")
	}
	lines := strings.Split(strings.TrimSpace(parts[0]), "\n")
	if len(lines) < 4 {
		return Snapshot{}, fmt.Errorf("host metric output is incomplete")
	}
	firstCPU, err := parseCPUFields(lines[0])
	if err != nil {
		return Snapshot{}, err
	}
	secondCPU, err := parseCPUFields(lines[1])
	if err != nil {
		return Snapshot{}, err
	}
	totalDelta := secondCPU.total - firstCPU.total
	idleDelta := secondCPU.idle - firstCPU.idle
	if totalDelta <= 0 || idleDelta < 0 || idleDelta > totalDelta {
		return Snapshot{}, fmt.Errorf("invalid CPU counters")
	}

	memTotal, memAvailable, err := parseMemory(lines[2:])
	if err != nil {
		return Snapshot{}, err
	}
	snapshot := Snapshot{
		CPUPercent:       float64(totalDelta-idleDelta) / float64(totalDelta) * 100,
		MemoryTotalBytes: memTotal,
		MemoryUsedBytes:  memTotal - memAvailable,
		GPUs:             make([]GPUMetric, 0),
	}
	for _, line := range strings.Split(strings.TrimSpace(parts[1]), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		gpu, err := parseGPUCSV(line)
		if err != nil {
			return Snapshot{}, err
		}
		snapshot.GPUs = append(snapshot.GPUs, gpu)
	}
	return snapshot, nil
}

type cpuCounters struct {
	total int64
	idle  int64
}

func parseCPUFields(line string) (cpuCounters, error) {
	fields := strings.Fields(line)
	if len(fields) < 5 || fields[0] != "cpu" {
		return cpuCounters{}, fmt.Errorf("invalid CPU line")
	}
	values := make([]int64, 0, len(fields)-1)
	for _, field := range fields[1:] {
		value, err := strconv.ParseInt(field, 10, 64)
		if err != nil || value < 0 {
			return cpuCounters{}, fmt.Errorf("invalid CPU counter")
		}
		values = append(values, value)
	}
	var total int64
	for _, value := range values {
		total += value
	}
	return cpuCounters{total: total, idle: values[3] + values[4]}, nil
}

func parseMemory(lines []string) (int64, int64, error) {
	values := make(map[string]int64, 2)
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) != 3 || (fields[0] != "MemTotal:" && fields[0] != "MemAvailable:") || fields[2] != "kB" {
			continue
		}
		value, err := strconv.ParseInt(fields[1], 10, 64)
		if err != nil || value < 0 {
			return 0, 0, fmt.Errorf("invalid memory counter")
		}
		values[fields[0]] = value * 1024
	}
	total, hasTotal := values["MemTotal:"]
	available, hasAvailable := values["MemAvailable:"]
	if !hasTotal || !hasAvailable || available > total {
		return 0, 0, fmt.Errorf("invalid memory output")
	}
	return total, available, nil
}

func parseGPUCSV(line string) (GPUMetric, error) {
	record, err := csv.NewReader(strings.NewReader(line)).Read()
	if err != nil || len(record) != 8 {
		return GPUMetric{}, fmt.Errorf("invalid nvidia-smi output")
	}
	index, err := strconv.Atoi(strings.TrimSpace(record[0]))
	if err != nil || index < 0 {
		return GPUMetric{}, fmt.Errorf("invalid GPU index")
	}
	parseFloat := func(value string) (float64, error) {
		parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
		if err != nil || parsed < 0 {
			return 0, fmt.Errorf("invalid GPU metric")
		}
		return parsed, nil
	}
	utilization, err := parseFloat(record[3])
	if err != nil {
		return GPUMetric{}, err
	}
	memoryUsed, err := parseFloat(record[4])
	if err != nil {
		return GPUMetric{}, err
	}
	memoryTotal, err := parseFloat(record[5])
	if err != nil || memoryUsed > memoryTotal {
		return GPUMetric{}, fmt.Errorf("invalid GPU memory metric")
	}
	temperature, err := parseFloat(record[6])
	if err != nil {
		return GPUMetric{}, err
	}
	power, err := parseFloat(record[7])
	if err != nil {
		return GPUMetric{}, err
	}
	return GPUMetric{
		Index:              index,
		Name:               strings.TrimSpace(record[1]),
		UUID:               strings.TrimSpace(record[2]),
		UtilizationPercent: utilization,
		MemoryUsedBytes:    int64(memoryUsed * 1024 * 1024),
		MemoryTotalBytes:   int64(memoryTotal * 1024 * 1024),
		TemperatureC:       temperature,
		PowerWatts:         power,
	}, nil
}
