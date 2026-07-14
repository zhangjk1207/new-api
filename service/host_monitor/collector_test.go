package hostmonitor

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPrivateKeyEncryptionRejectsTamperedCiphertext(t *testing.T) {
	originalSecret := common.CryptoSecret
	common.CryptoSecret = "host-monitor-test-secret"
	t.Cleanup(func() { common.CryptoSecret = originalSecret })

	ciphertext, err := EncryptPrivateKey("private-key")
	require.NoError(t, err)
	plaintext, err := DecryptPrivateKey(ciphertext)
	require.NoError(t, err)
	assert.Equal(t, "private-key", plaintext)

	_, err = DecryptPrivateKey(ciphertext[:len(ciphertext)-1] + "x")
	require.Error(t, err)
}

func TestParseCollectionOutputParsesCPUAndNvidiaGPUs(t *testing.T) {
	output := `cpu  100 20 30 400 10 0 0 0 0 0
cpu  120 20 40 480 10 0 0 0 0 0
MemTotal:       65536 kB
MemAvailable:   16384 kB
__NEW_API_GPU__
0, NVIDIA H100, GPU-aaa, 75, 1024, 81920, 56, 320.50
1, NVIDIA H100, GPU-bbb, 20, 2048, 81920, 48, 120.00
`

	snapshot, err := ParseCollectionOutput(output)

	require.NoError(t, err)
	assert.InDelta(t, 27.27, snapshot.CPUPercent, 0.01)
	assert.EqualValues(t, 65536*1024, snapshot.MemoryTotalBytes)
	assert.EqualValues(t, 49152*1024, snapshot.MemoryUsedBytes)
	require.Len(t, snapshot.GPUs, 2)
	assert.Equal(t, "GPU-aaa", snapshot.GPUs[0].UUID)
	assert.InDelta(t, 75, snapshot.GPUs[0].UtilizationPercent, 0.01)
	assert.EqualValues(t, 1024*1024*1024, snapshot.GPUs[0].MemoryUsedBytes)
	assert.InDelta(t, 320.5, snapshot.GPUs[0].PowerWatts, 0.01)
}

func TestValidateHostInputRejectsInvalidConnectionDetails(t *testing.T) {
	validKey := "-----BEGIN OPENSSH PRIVATE KEY-----\ninvalid\n-----END OPENSSH PRIVATE KEY-----"
	assert.Error(t, ValidateHostInput(model.HostMonitor{Name: "", Address: "172.16.0.72", Port: 22, Username: "monitor"}, validKey, true))
	assert.Error(t, ValidateHostInput(model.HostMonitor{Name: "node", Address: "bad host!", Port: 22, Username: "monitor"}, validKey, true))
	assert.Error(t, ValidateHostInput(model.HostMonitor{Name: "node", Address: "172.16.0.72", Port: 0, Username: "monitor"}, validKey, true))
	assert.Error(t, ValidateHostInput(model.HostMonitor{Name: "node", Address: "172.16.0.72", Port: 22, Username: ""}, validKey, true))
	assert.Error(t, ValidateHostInput(model.HostMonitor{Name: "node", Address: "172.16.0.72", Port: 22, Username: "monitor"}, validKey, true))
}
