package constant

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPath2RelayModePlaygroundResponses(t *testing.T) {
	require.Equal(t, RelayModeResponses, Path2RelayMode("/pg/responses"))
}
