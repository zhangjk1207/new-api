package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

func GetUserModelTokenStats(c *gin.Context) {
	startTimestamp, endTimestamp, ok := parseFlowQuotaTimeRange(c)
	if !ok {
		return
	}

	stats, err := model.GetUserModelTokenStats(model.UserModelTokenStatsFilter{
		StartTime: startTimestamp,
		EndTime:   endTimestamp,
		Username:  c.Query("username"),
		TokenName: c.Query("token_name"),
		ModelName: c.Query("model_name"),
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    stats,
	})
}
