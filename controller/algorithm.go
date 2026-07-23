package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

const (
	algorithmOpenAPIMaxBytes = 8 << 20
	algorithmBodyMaxBytes    = 512 << 20
)

var algorithmNamePattern = regexp.MustCompile(`^[a-z][a-z0-9-]{1,63}$`)

type algorithmRequest struct {
	Name           string          `json:"name"`
	DisplayName    string          `json:"display_name"`
	Description    string          `json:"description"`
	Category       string          `json:"category"`
	Tags           []string        `json:"tags"`
	Icon           string          `json:"icon"`
	Version        string          `json:"version"`
	Enabled        *bool           `json:"enabled"`
	OpenAPIURL     string          `json:"openapi_url"`
	BaseURL        string          `json:"base_url"`
	OperationID    string          `json:"operation_id"`
	Method         string          `json:"method"`
	Path           string          `json:"path"`
	ContentType    string          `json:"content_type"`
	RequestSchema  json.RawMessage `json:"request_schema"`
	TimeoutSeconds int             `json:"timeout_seconds"`
	Price          *float64        `json:"price"`
}

type algorithmResponse struct {
	model.Algorithm
	Tags            []string `json:"tags"`
	Price           float64  `json:"price"`
	PriceConfigured bool     `json:"price_configured"`
}

type openAPIImportRequest struct {
	URL string `json:"url"`
}

type openAPIOperation struct {
	OperationID   string          `json:"operation_id"`
	Summary       string          `json:"summary"`
	Method        string          `json:"method"`
	Path          string          `json:"path"`
	ContentTypes  []string        `json:"content_types"`
	RequestSchema json.RawMessage `json:"request_schema,omitempty"`
}

type openAPIImportResponse struct {
	Title      string             `json:"title"`
	Version    string             `json:"version"`
	OpenAPIURL string             `json:"openapi_url"`
	BaseURL    string             `json:"base_url"`
	Operations []openAPIOperation `json:"operations"`
}

func algorithmToResponse(algorithm model.Algorithm) algorithmResponse {
	tags := make([]string, 0)
	if strings.TrimSpace(algorithm.Tags) != "" {
		_ = common.UnmarshalJsonStr(algorithm.Tags, &tags)
	}
	price, configured := ratio_setting.GetModelPrice(algorithm.PricingModel, false)
	if !configured {
		price = 0
	}
	return algorithmResponse{Algorithm: algorithm, Tags: tags, Price: price, PriceConfigured: configured}
}

func ListAlgorithms(c *gin.Context) {
	algorithms, err := model.ListAlgorithms(false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	responses := make([]algorithmResponse, 0, len(algorithms))
	for _, algorithm := range algorithms {
		responses = append(responses, algorithmToResponse(algorithm))
	}
	common.ApiSuccess(c, responses)
}

func ListPublicAlgorithms(c *gin.Context) {
	algorithms, err := model.ListAlgorithms(true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	responses := make([]algorithmResponse, 0, len(algorithms))
	for _, algorithm := range algorithms {
		responses = append(responses, algorithmToResponse(algorithm))
	}
	common.ApiSuccess(c, responses)
}

func normalizeAlgorithmRequest(req algorithmRequest, existing *model.Algorithm) (*model.Algorithm, error) {
	name := strings.ToLower(strings.TrimSpace(req.Name))
	if existing != nil {
		name = existing.Name
	}
	if !algorithmNamePattern.MatchString(name) {
		return nil, fmt.Errorf("algorithm name must use 2-64 lowercase letters, numbers, or hyphens")
	}
	displayName := strings.TrimSpace(req.DisplayName)
	if displayName == "" {
		return nil, fmt.Errorf("display name is required")
	}
	baseURL, err := validateHTTPURL(req.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid base URL: %w", err)
	}
	method := strings.ToUpper(strings.TrimSpace(req.Method))
	if method != http.MethodPost && method != http.MethodPut && method != http.MethodPatch {
		return nil, fmt.Errorf("only POST, PUT, and PATCH operations are supported")
	}
	operationPath := strings.TrimSpace(req.Path)
	if !strings.HasPrefix(operationPath, "/") {
		return nil, fmt.Errorf("operation path must start with /")
	}
	contentType := strings.TrimSpace(req.ContentType)
	if contentType != "application/json" && contentType != "multipart/form-data" && contentType != "application/x-www-form-urlencoded" {
		return nil, fmt.Errorf("unsupported content type")
	}
	timeout := req.TimeoutSeconds
	if timeout == 0 {
		timeout = 300
	}
	if timeout < 1 || timeout > 3600 {
		return nil, fmt.Errorf("timeout must be between 1 and 3600 seconds")
	}
	tags, err := common.Marshal(req.Tags)
	if err != nil {
		return nil, err
	}
	schema := ""
	if len(req.RequestSchema) > 0 && string(req.RequestSchema) != "null" {
		schema = string(req.RequestSchema)
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	} else if existing != nil {
		enabled = existing.Enabled
	}
	return &model.Algorithm{
		Name: name, DisplayName: displayName, Description: strings.TrimSpace(req.Description),
		Category: strings.TrimSpace(req.Category), Tags: string(tags), Icon: strings.TrimSpace(req.Icon),
		Version: strings.TrimSpace(req.Version), Enabled: enabled, OpenAPIURL: strings.TrimSpace(req.OpenAPIURL),
		BaseURL: baseURL.String(), OperationID: strings.TrimSpace(req.OperationID), Method: method,
		Path: operationPath, ContentType: contentType, RequestSchema: schema, TimeoutSeconds: timeout,
		PricingModel: "algorithm:" + name,
	}, nil
}

func updateAlgorithmPrice(pricingModel string, price *float64) error {
	if price == nil {
		return nil
	}
	if math.IsNaN(*price) || math.IsInf(*price, 0) || *price < 0 {
		return fmt.Errorf("price must be a non-negative finite number")
	}
	prices := ratio_setting.GetModelPriceCopy()
	prices[pricingModel] = *price
	data, err := common.Marshal(prices)
	if err != nil {
		return err
	}
	return model.UpdateOption("ModelPrice", string(data))
}

func CreateAlgorithm(c *gin.Context) {
	var req algorithmRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "invalid algorithm request")
		return
	}
	algorithm, err := normalizeAlgorithmRequest(req, nil)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if req.Price == nil {
		common.ApiErrorMsg(c, "price is required")
		return
	}
	if err := model.CreateAlgorithm(algorithm); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := updateAlgorithmPrice(algorithm.PricingModel, req.Price); err != nil {
		_ = model.DeleteAlgorithm(algorithm.Id)
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, algorithmToResponse(*algorithm))
}

func UpdateAlgorithm(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "invalid algorithm ID")
		return
	}
	existing, err := model.GetAlgorithmByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req algorithmRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "invalid algorithm request")
		return
	}
	algorithm, err := normalizeAlgorithmRequest(req, existing)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	algorithm.Id = existing.Id
	algorithm.CreatedAt = existing.CreatedAt
	if err := updateAlgorithmPrice(algorithm.PricingModel, req.Price); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.UpdateAlgorithm(algorithm); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, algorithmToResponse(*algorithm))
}

func DeleteAlgorithm(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "invalid algorithm ID")
		return
	}
	algorithm, err := model.GetAlgorithmByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.DeleteAlgorithm(id); err != nil {
		common.ApiError(c, err)
		return
	}
	prices := ratio_setting.GetModelPriceCopy()
	delete(prices, algorithm.PricingModel)
	if data, marshalErr := common.Marshal(prices); marshalErr == nil {
		_ = model.UpdateOption("ModelPrice", string(data))
	}
	common.ApiSuccess(c, nil)
}

func validateHTTPURL(raw string) (*url.URL, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return nil, err
	}
	if (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return nil, fmt.Errorf("URL must use http or https")
	}
	return parsed, nil
}

func ImportAlgorithmOpenAPI(c *gin.Context) {
	var req openAPIImportRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "invalid OpenAPI import request")
		return
	}
	parsedURL, err := validateHTTPURL(req.URL)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	request, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	client := &http.Client{Timeout: 15 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		common.ApiErrorMsg(c, fmt.Sprintf("OpenAPI endpoint returned HTTP %d", response.StatusCode))
		return
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, algorithmOpenAPIMaxBytes+1))
	if err != nil || len(data) > algorithmOpenAPIMaxBytes {
		common.ApiErrorMsg(c, "OpenAPI document is too large or unreadable")
		return
	}
	var document map[string]any
	if err := common.Unmarshal(data, &document); err != nil {
		common.ApiErrorMsg(c, "invalid OpenAPI JSON")
		return
	}
	result := openAPIImportResponse{OpenAPIURL: parsedURL.String(), Operations: make([]openAPIOperation, 0)}
	if info, ok := document["info"].(map[string]any); ok {
		result.Title, _ = info["title"].(string)
		result.Version, _ = info["version"].(string)
	}
	if servers, ok := document["servers"].([]any); ok && len(servers) > 0 {
		if server, ok := servers[0].(map[string]any); ok {
			result.BaseURL, _ = server["url"].(string)
		}
	}
	if strings.TrimSpace(result.BaseURL) == "" {
		base := *parsedURL
		base.Path = strings.TrimSuffix(path.Dir(base.Path), "/")
		base.RawQuery = ""
		base.Fragment = ""
		result.BaseURL = strings.TrimSuffix(base.String(), "/")
	}
	paths, _ := document["paths"].(map[string]any)
	for operationPath, rawPath := range paths {
		pathItem, ok := rawPath.(map[string]any)
		if !ok {
			continue
		}
		for _, method := range []string{"post", "put", "patch"} {
			rawOperation, ok := pathItem[method].(map[string]any)
			if !ok {
				continue
			}
			operation := openAPIOperation{Method: strings.ToUpper(method), Path: operationPath, ContentTypes: make([]string, 0)}
			operation.OperationID, _ = rawOperation["operationId"].(string)
			operation.Summary, _ = rawOperation["summary"].(string)
			if requestBody, ok := rawOperation["requestBody"].(map[string]any); ok {
				if content, ok := requestBody["content"].(map[string]any); ok {
					for contentType, rawMedia := range content {
						if contentType != "application/json" && contentType != "multipart/form-data" && contentType != "application/x-www-form-urlencoded" {
							continue
						}
						operation.ContentTypes = append(operation.ContentTypes, contentType)
						if media, ok := rawMedia.(map[string]any); ok && len(operation.RequestSchema) == 0 {
							schema := media["schema"]
							if schemaMap, ok := schema.(map[string]any); ok {
								if ref, ok := schemaMap["$ref"].(string); ok {
									parts := strings.Split(ref, "/")
									if len(parts) == 4 {
										if components, ok := document["components"].(map[string]any); ok {
											if schemas, ok := components["schemas"].(map[string]any); ok {
												schema = schemas[parts[3]]
											}
										}
									}
								}
							}
							if schemaData, err := common.Marshal(schema); err == nil {
								operation.RequestSchema = schemaData
							}
						}
					}
				}
			}
			if len(operation.ContentTypes) > 0 {
				result.Operations = append(result.Operations, operation)
			}
		}
	}
	common.ApiSuccess(c, result)
}

func prepareAlgorithmRequest(c *gin.Context, contentType string) (string, io.Reader, string, error) {
	requestContentType := c.GetHeader("Content-Type")
	if strings.HasPrefix(requestContentType, "multipart/form-data") {
		if contentType != "" && contentType != "multipart/form-data" {
			return "", nil, "", fmt.Errorf("configured operation does not accept multipart data")
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, algorithmBodyMaxBytes)
		if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
			return "", nil, "", err
		}
		algorithmName := strings.TrimSpace(c.Request.FormValue("algorithm"))
		var body bytes.Buffer
		writer := multipart.NewWriter(&body)
		for key, values := range c.Request.MultipartForm.Value {
			if key == "algorithm" {
				continue
			}
			for _, value := range values {
				if err := writer.WriteField(key, value); err != nil {
					return "", nil, "", err
				}
			}
		}
		for key, files := range c.Request.MultipartForm.File {
			for _, fileHeader := range files {
				file, err := fileHeader.Open()
				if err != nil {
					return "", nil, "", err
				}
				part, err := writer.CreateFormFile(key, fileHeader.Filename)
				if err == nil {
					_, err = io.Copy(part, file)
				}
				_ = file.Close()
				if err != nil {
					return "", nil, "", err
				}
			}
		}
		if err := writer.Close(); err != nil {
			return "", nil, "", err
		}
		return algorithmName, &body, writer.FormDataContentType(), nil
	}
	if strings.HasPrefix(requestContentType, "application/json") {
		if contentType != "" && contentType != "application/json" {
			return "", nil, "", fmt.Errorf("configured operation does not accept JSON")
		}
		data, err := io.ReadAll(io.LimitReader(c.Request.Body, algorithmBodyMaxBytes+1))
		if err != nil || len(data) > algorithmBodyMaxBytes {
			return "", nil, "", fmt.Errorf("request body is too large or unreadable")
		}
		var payload map[string]json.RawMessage
		if err := common.Unmarshal(data, &payload); err != nil {
			return "", nil, "", fmt.Errorf("invalid JSON request")
		}
		var algorithmName string
		if raw, ok := payload["algorithm"]; ok {
			_ = common.Unmarshal(raw, &algorithmName)
			delete(payload, "algorithm")
		}
		forwarded, err := common.Marshal(payload)
		return strings.TrimSpace(algorithmName), bytes.NewReader(forwarded), "application/json", err
	}
	if strings.HasPrefix(requestContentType, "application/x-www-form-urlencoded") {
		if contentType != "" && contentType != "application/x-www-form-urlencoded" {
			return "", nil, "", fmt.Errorf("configured operation does not accept form data")
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, algorithmBodyMaxBytes)
		if err := c.Request.ParseForm(); err != nil {
			return "", nil, "", err
		}
		algorithmName := strings.TrimSpace(c.Request.Form.Get("algorithm"))
		c.Request.Form.Del("algorithm")
		return algorithmName, strings.NewReader(c.Request.Form.Encode()), "application/x-www-form-urlencoded", nil
	}
	return "", nil, "", fmt.Errorf("content type must be JSON, multipart, or form data")
}

func proxyAlgorithmRequest(ctx *gin.Context, algorithm *model.Algorithm, body io.Reader, contentType string) (*http.Response, error) {
	upstreamBase, err := url.Parse(algorithm.BaseURL)
	if err != nil {
		return nil, err
	}
	relative, err := url.Parse(algorithm.Path)
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequestWithContext(
		ctx.Request.Context(),
		algorithm.Method,
		upstreamBase.ResolveReference(relative).String(),
		body,
	)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", contentType)
	request.Header.Set("Accept", ctx.GetHeader("Accept"))
	client := &http.Client{Timeout: time.Duration(algorithm.TimeoutSeconds) * time.Second}
	return client.Do(request)
}

func copyAlgorithmResponse(c *gin.Context, response *http.Response) {
	for key, values := range response.Header {
		if strings.EqualFold(key, "Content-Length") || strings.EqualFold(key, "Transfer-Encoding") {
			continue
		}
		for _, value := range values {
			c.Writer.Header().Add(key, value)
		}
	}
	c.Status(response.StatusCode)
	_, _ = io.Copy(c.Writer, response.Body)
}

func TestAlgorithm(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "invalid algorithm ID")
		return
	}
	algorithm, err := model.GetAlgorithmByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	_, body, contentType, err := prepareAlgorithmRequest(c, algorithm.ContentType)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	startedAt := time.Now()
	response, err := proxyAlgorithmRequest(c, algorithm, body, contentType)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	defer response.Body.Close()
	c.Header("X-Algorithm-Test-Duration-Ms", strconv.FormatInt(time.Since(startedAt).Milliseconds(), 10))
	copyAlgorithmResponse(c, response)
}

func InvokeAlgorithm(c *gin.Context) {
	requestContentType := c.GetHeader("Content-Type")
	algorithmName := strings.TrimSpace(c.Query("algorithm"))
	var body io.Reader
	var forwardedContentType string
	var err error
	if strings.HasPrefix(requestContentType, "multipart/form-data") || strings.HasPrefix(requestContentType, "application/json") || strings.HasPrefix(requestContentType, "application/x-www-form-urlencoded") {
		var bodyAlgorithm string
		bodyAlgorithm, body, forwardedContentType, err = prepareAlgorithmRequest(c, "")
		if algorithmName == "" {
			algorithmName = bodyAlgorithm
		}
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": err.Error(), "type": "invalid_request_error"}})
		return
	}
	if algorithmName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "algorithm is required", "type": "invalid_request_error"}})
		return
	}
	algorithm, err := model.GetEnabledAlgorithmByName(algorithmName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"message": "algorithm is not available", "type": "invalid_request_error"}})
		return
	}
	if body == nil {
		_, body, forwardedContentType, err = prepareAlgorithmRequest(c, algorithm.ContentType)
	} else if algorithm.ContentType != "" && !strings.HasPrefix(forwardedContentType, algorithm.ContentType) {
		err = fmt.Errorf("request content type does not match the configured operation")
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": err.Error(), "type": "invalid_request_error"}})
		return
	}
	info, err := relaycommon.GenRelayInfo(c, types.RelayFormatTask, nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": err.Error(), "type": "server_error"}})
		return
	}
	info.OriginModelName = algorithm.PricingModel
	if info.UsingGroup == "" {
		info.UsingGroup = info.TokenGroup
	}
	info.Action = algorithm.DisplayName
	info.ForcePreConsume = true
	info.ChannelMeta = &relaycommon.ChannelMeta{}
	priceData, err := helper.ModelPriceHelperPerCall(c, info)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": err.Error(), "type": "billing_error"}})
		return
	}
	if apiErr := service.PreConsumeBilling(c, priceData.Quota, info); apiErr != nil {
		statusCode := apiErr.StatusCode
		if statusCode < 400 {
			statusCode = http.StatusBadRequest
		}
		c.JSON(statusCode, gin.H{"error": gin.H{"message": apiErr.Error(), "type": "billing_error"}})
		return
	}
	response, err := proxyAlgorithmRequest(c, algorithm, body, forwardedContentType)
	if err != nil {
		info.Billing.Refund(c)
		c.JSON(http.StatusBadGateway, gin.H{"error": gin.H{"message": err.Error(), "type": "upstream_error"}})
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		info.Billing.Refund(c)
		copyAlgorithmResponse(c, response)
		return
	}
	info.PriceData = priceData
	if err := service.SettleBilling(c, info, priceData.Quota); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": err.Error(), "type": "billing_error"}})
		return
	}
	service.LogTaskConsumption(c, info)
	copyAlgorithmResponse(c, response)
}
