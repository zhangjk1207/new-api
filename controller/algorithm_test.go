package controller

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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
