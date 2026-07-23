package controller

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupAlgorithmControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	originalDB := model.DB
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	require.NoError(t, db.AutoMigrate(&model.Algorithm{}))
	t.Cleanup(func() {
		model.DB = originalDB
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			_ = sqlDB.Close()
		}
	})
	return db
}

func TestImportAlgorithmOpenAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	openAPIServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
  "openapi":"3.1.0",
  "info":{"title":"Parser","version":"1.0"},
  "servers":[{"url":"http://parser.internal"}],
  "paths":{"/parse":{"post":{"operationId":"parseDocument","summary":"Parse document","requestBody":{"content":{"multipart/form-data":{"schema":{"type":"object","properties":{"files":{"type":"array"}}}}}}}}}
}`))
	}))
	defer openAPIServer.Close()

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/api/algorithms/import-openapi", strings.NewReader(`{"url":"`+openAPIServer.URL+`"}`))
	ImportAlgorithmOpenAPI(context)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.Contains(t, recorder.Body.String(), `"operation_id":"parseDocument"`)
	assert.Contains(t, recorder.Body.String(), `"base_url":"http://parser.internal"`)
	assert.Contains(t, recorder.Body.String(), `"content_types":["multipart/form-data"]`)
}

func TestPrepareAlgorithmMultipartRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var input bytes.Buffer
	writer := multipart.NewWriter(&input)
	require.NoError(t, writer.WriteField("algorithm", "document-parser"))
	require.NoError(t, writer.WriteField("backend", "pipeline"))
	file, err := writer.CreateFormFile("files", "sample.pdf")
	require.NoError(t, err)
	_, err = file.Write([]byte("pdf-content"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = httptest.NewRequest(http.MethodPost, "/v1/algorithms/invoke", &input)
	context.Request.Header.Set("Content-Type", writer.FormDataContentType())

	algorithm, body, contentType, err := prepareAlgorithmRequest(context, "multipart/form-data")
	require.NoError(t, err)
	assert.Equal(t, "document-parser", algorithm)

	forwarded := httptest.NewRequest(http.MethodPost, "/parse", body)
	forwarded.Header.Set("Content-Type", contentType)
	require.NoError(t, forwarded.ParseMultipartForm(1<<20))
	assert.Empty(t, forwarded.FormValue("algorithm"))
	assert.Equal(t, "pipeline", forwarded.FormValue("backend"))
	uploaded, header, err := forwarded.FormFile("files")
	require.NoError(t, err)
	defer uploaded.Close()
	assert.Equal(t, "sample.pdf", header.Filename)
}

func TestAlgorithmForwardsAdminMultipartRequestWithoutRequiringEnabled(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupAlgorithmControllerTestDB(t)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		require.NoError(t, request.ParseMultipartForm(1<<20))
		assert.Equal(t, "pipeline", request.FormValue("backend"))
		file, header, err := request.FormFile("files")
		require.NoError(t, err)
		defer file.Close()
		assert.Equal(t, "sample.pdf", header.Filename)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"parsed":true}`))
	}))
	defer upstream.Close()

	algorithm := &model.Algorithm{
		Name: "document-parser", DisplayName: "Document Parser", Enabled: false,
		BaseURL: upstream.URL, Method: http.MethodPost, Path: "/parse",
		ContentType: "multipart/form-data", TimeoutSeconds: 10,
		PricingModel: "algorithm:document-parser",
	}
	require.NoError(t, model.CreateAlgorithm(algorithm))

	var input bytes.Buffer
	writer := multipart.NewWriter(&input)
	require.NoError(t, writer.WriteField("backend", "pipeline"))
	file, err := writer.CreateFormFile("files", "sample.pdf")
	require.NoError(t, err)
	_, err = file.Write([]byte("pdf-content"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Params = gin.Params{{Key: "id", Value: fmt.Sprint(algorithm.Id)}}
	context.Request = httptest.NewRequest(http.MethodPost, "/api/algorithms/1/test", &input)
	context.Request.Header.Set("Content-Type", writer.FormDataContentType())
	TestAlgorithm(context)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.JSONEq(t, `{"parsed":true}`, recorder.Body.String())
	assert.NotEmpty(t, recorder.Header().Get("X-Algorithm-Test-Duration-Ms"))
}
