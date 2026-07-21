package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	perfmetrics "github.com/QuantumNous/new-api/pkg/perf_metrics"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPerfMetricsSummaryResponseIncludesRequestCount(t *testing.T) {
	response := perfmetrics.SummaryAllResult{
		Models: []perfmetrics.ModelSummary{{
			ModelName:    "zhiqing-local",
			RequestCount: 37,
			SuccessRate:  91.89,
		}},
	}

	data, err := common.Marshal(response)
	require.NoError(t, err)

	var payload struct {
		Models []struct {
			ModelName    string  `json:"model_name"`
			RequestCount int64   `json:"request_count"`
			SuccessRate  float64 `json:"success_rate"`
		} `json:"models"`
	}
	require.NoError(t, common.Unmarshal(data, &payload))
	require.Len(t, payload.Models, 1)
	assert.Equal(t, "zhiqing-local", payload.Models[0].ModelName)
	assert.Equal(t, int64(37), payload.Models[0].RequestCount)
	assert.Equal(t, 91.89, payload.Models[0].SuccessRate)
}

func TestSanitizePerfMetricsSummaryForPublicViewerHidesRequestCount(t *testing.T) {
	result := perfmetrics.SummaryAllResult{
		Models: []perfmetrics.ModelSummary{{ModelName: "zhiqing-local", RequestCount: 37}},
	}

	public := sanitizePerfMetricsSummaryForViewer(result, false)
	authenticated := sanitizePerfMetricsSummaryForViewer(result, true)

	require.Len(t, public.Models, 1)
	assert.Zero(t, public.Models[0].RequestCount)
	assert.Equal(t, int64(37), authenticated.Models[0].RequestCount)
	assert.Equal(t, int64(37), result.Models[0].RequestCount)
}
