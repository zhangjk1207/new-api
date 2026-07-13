package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestUptimeStatusRequiresUserAuthentication(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(sessions.Sessions("session", cookie.NewStore([]byte("uptime-status-test"))))
	SetApiRouter(engine)

	request := httptest.NewRequest(http.MethodGet, "/api/uptime/status", nil)
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusUnauthorized, recorder.Code)
}

func TestUptimeStatusAllowsRegularUsers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(sessions.Sessions("session", cookie.NewStore([]byte("uptime-status-test"))))
	engine.GET("/test/login", func(c *gin.Context) {
		session := sessions.Default(c)
		session.Set("username", "regular-user")
		session.Set("role", 1)
		session.Set("id", 1)
		session.Set("status", 1)
		require.NoError(t, session.Save())
		c.Status(http.StatusNoContent)
	})
	SetApiRouter(engine)

	loginRequest := httptest.NewRequest(http.MethodGet, "/test/login", nil)
	loginRecorder := httptest.NewRecorder()
	engine.ServeHTTP(loginRecorder, loginRequest)

	request := httptest.NewRequest(http.MethodGet, "/api/uptime/status", nil)
	request.Header.Set("New-Api-User", "1")
	request.Header.Set("Cookie", loginRecorder.Header().Get("Set-Cookie"))
	recorder := httptest.NewRecorder()

	engine.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
}
