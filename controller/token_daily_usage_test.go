package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestGetTokenDailyUsageResponseContract(t *testing.T) {
	originalLogDB := model.LOG_DB
	t.Cleanup(func() { model.LOG_DB = originalLogDB })

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.Log{}))
	model.LOG_DB = db

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/usage/token/daily?start_date=2026-07-27&end_date=2026-07-27", nil)
	ctx.Set("token_id", 7)
	GetTokenDailyUsage(ctx)

	assert.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool   `json:"success"`
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.True(t, response.Success)
	assert.Equal(t, constant.APIResponseCodeSuccess, response.Code)
	assert.Equal(t, "ok", response.Message)
}

func TestParseTokenUsageDateRange(t *testing.T) {
	now := time.Date(2026, 7, 27, 20, 30, 0, 0, time.UTC)

	t.Run("defaults to current Beijing date", func(t *testing.T) {
		start, end, err := parseTokenUsageDateRange("", "", now)
		require.NoError(t, err)
		assert.Equal(t, "2026-07-28", start.Format(time.DateOnly))
		assert.Equal(t, start, end)
	})

	t.Run("accepts inclusive range", func(t *testing.T) {
		start, end, err := parseTokenUsageDateRange("2026-07-01", "2026-07-27", now)
		require.NoError(t, err)
		assert.Equal(t, "2026-07-01", start.Format(time.DateOnly))
		assert.Equal(t, "2026-07-27", end.Format(time.DateOnly))
	})

	t.Run("requires both dates", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2026-07-01", "", now)
		assert.EqualError(t, err, "start_date and end_date must be provided together")
		assert.Equal(t, constant.APIResponseCodeDateRangeRequired, err.(*tokenUsageRequestError).code)
	})

	t.Run("rejects invalid start date", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2026/07/01", "2026-07-27", now)
		assert.EqualError(t, err, "start_date must use YYYY-MM-DD")
		assert.Equal(t, constant.APIResponseCodeInvalidStartDate, err.(*tokenUsageRequestError).code)
	})

	t.Run("rejects invalid end date", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2026-07-01", "2026/07/27", now)
		assert.EqualError(t, err, "end_date must use YYYY-MM-DD")
		assert.Equal(t, constant.APIResponseCodeInvalidEndDate, err.(*tokenUsageRequestError).code)
	})

	t.Run("rejects reversed range", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2026-07-28", "2026-07-27", now)
		assert.EqualError(t, err, "end_date must not be earlier than start_date")
		assert.Equal(t, constant.APIResponseCodeInvalidDateOrder, err.(*tokenUsageRequestError).code)
	})

	t.Run("rejects more than 366 days", func(t *testing.T) {
		_, _, err := parseTokenUsageDateRange("2025-01-01", "2026-01-02", now)
		assert.EqualError(t, err, "date range must not exceed 366 days")
		assert.Equal(t, constant.APIResponseCodeDateRangeTooLarge, err.(*tokenUsageRequestError).code)
	})
}
