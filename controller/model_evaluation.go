package controller

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/tidwall/gjson"
	"github.com/xuri/excelize/v2"
)

const (
	modelEvaluationModeRouting      = "routing"
	modelEvaluationModeFixedChannel = "fixed_channel"
	modelEvaluationMaxImportBytes   = 8 << 20
	modelEvaluationMaxResponseBytes = 4 << 20
)

type modelEvaluationQuestionInput struct {
	Category        string `json:"category"`
	Prompt          string `json:"prompt"`
	ReferenceAnswer string `json:"reference_answer"`
	Rubric          string `json:"rubric"`
}

type modelEvaluationQuestionSetInput struct {
	Name        string                         `json:"name"`
	Description string                         `json:"description"`
	Questions   []modelEvaluationQuestionInput `json:"questions"`
}

type modelEvaluationRunInput struct {
	Name          string `json:"name"`
	QuestionSetId int    `json:"question_set_id"`
	ModelName     string `json:"model_name"`
	Mode          string `json:"mode"`
	ChannelId     int    `json:"channel_id"`
	GroupName     string `json:"group_name"`
}

type modelEvaluationScoreInput struct {
	Score   int    `json:"score"`
	Comment string `json:"comment"`
}

type modelEvaluationRunDetail struct {
	Run     *model.ModelEvaluationRun     `json:"run"`
	Results []model.ModelEvaluationResult `json:"results"`
}

type modelEvaluationChannelOption struct {
	Id     int      `json:"id"`
	Name   string   `json:"name"`
	Models []string `json:"models"`
	Groups []string `json:"groups"`
}

type modelEvaluationOptions struct {
	Models   []string                       `json:"models"`
	Channels []modelEvaluationChannelOption `json:"channels"`
	Groups   map[string]string              `json:"groups"`
}

func parseModelEvaluationID(c *gin.Context, name string) (int, error) {
	id, err := strconv.Atoi(c.Param(name))
	if err != nil || id <= 0 {
		return 0, fmt.Errorf("invalid %s", name)
	}
	return id, nil
}

func validateModelEvaluationQuestionSetInput(input modelEvaluationQuestionSetInput) ([]model.ModelEvaluationQuestion, error) {
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" || len([]rune(input.Name)) > 128 {
		return nil, errors.New("question set name must contain 1 to 128 characters")
	}
	if len(input.Questions) == 0 || len(input.Questions) > 500 {
		return nil, errors.New("question set must contain 1 to 500 questions")
	}
	questions := make([]model.ModelEvaluationQuestion, 0, len(input.Questions))
	for index, item := range input.Questions {
		category := strings.TrimSpace(item.Category)
		prompt := strings.TrimSpace(item.Prompt)
		if category == "" {
			category = "通用"
		}
		if len([]rune(category)) > 64 {
			return nil, fmt.Errorf("question %d category is too long", index+1)
		}
		if prompt == "" || len([]rune(prompt)) > 20000 {
			return nil, fmt.Errorf("question %d prompt must contain 1 to 20000 characters", index+1)
		}
		questions = append(questions, model.ModelEvaluationQuestion{
			Category:        category,
			Prompt:          prompt,
			ReferenceAnswer: strings.TrimSpace(item.ReferenceAnswer),
			Rubric:          strings.TrimSpace(item.Rubric),
			SortOrder:       index + 1,
		})
	}
	return questions, nil
}

func ListModelEvaluationQuestionSets(c *gin.Context) {
	sets, err := model.ListModelEvaluationQuestionSets()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, sets)
}

func CreateModelEvaluationQuestionSet(c *gin.Context) {
	var input modelEvaluationQuestionSetInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		common.ApiErrorMsg(c, "invalid question set request")
		return
	}
	questions, err := validateModelEvaluationQuestionSetInput(input)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	name := strings.TrimSpace(input.Name)
	version, err := model.NextModelEvaluationQuestionSetVersion(name)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	set := model.ModelEvaluationQuestionSet{
		Name:        name,
		Description: strings.TrimSpace(input.Description),
		Version:     version,
		CreatedBy:   c.GetInt("id"),
	}
	if err := model.CreateModelEvaluationQuestionSet(&set, questions); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "model_evaluation.question_set_create", map[string]interface{}{"question_set_id": set.Id, "question_count": len(questions)})
	created, err := model.GetModelEvaluationQuestionSet(set.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, created)
}

func UpdateModelEvaluationQuestionSet(c *gin.Context) {
	id, err := parseModelEvaluationID(c, "id")
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	set, err := model.GetModelEvaluationQuestionSet(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var input modelEvaluationQuestionSetInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		common.ApiErrorMsg(c, "invalid question set request")
		return
	}
	questions, err := validateModelEvaluationQuestionSetInput(input)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	set.Name = strings.TrimSpace(input.Name)
	set.Description = strings.TrimSpace(input.Description)
	if err := model.ReplaceModelEvaluationQuestions(set, questions); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	recordManageAudit(c, "model_evaluation.question_set_update", map[string]interface{}{"question_set_id": set.Id, "question_count": len(questions)})
	updated, err := model.GetModelEvaluationQuestionSet(set.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, updated)
}

func DeleteModelEvaluationQuestionSet(c *gin.Context) {
	id, err := parseModelEvaluationID(c, "id")
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if err := model.DeleteModelEvaluationQuestionSet(id); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	recordManageAudit(c, "model_evaluation.question_set_delete", map[string]interface{}{"question_set_id": id})
	common.ApiSuccess(c, nil)
}

func parseModelEvaluationJSONL(reader io.Reader) ([]modelEvaluationQuestionInput, error) {
	questions := make([]modelEvaluationQuestionInput, 0)
	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		var question modelEvaluationQuestionInput
		if err := common.Unmarshal(line, &question); err != nil {
			return nil, fmt.Errorf("invalid JSONL at line %d: %w", lineNumber, err)
		}
		questions = append(questions, question)
	}
	return questions, scanner.Err()
}

func parseModelEvaluationExcel(reader io.Reader) ([]modelEvaluationQuestionInput, error) {
	file, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, err
	}
	defer func() { _ = file.Close() }()
	sheets := file.GetSheetList()
	if len(sheets) == 0 {
		return nil, errors.New("Excel file does not contain a worksheet")
	}
	rows, err := file.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}
	questions := make([]modelEvaluationQuestionInput, 0)
	for index, row := range rows {
		if index == 0 {
			continue
		}
		for len(row) < 4 {
			row = append(row, "")
		}
		if strings.TrimSpace(row[1]) == "" {
			continue
		}
		questions = append(questions, modelEvaluationQuestionInput{
			Category:        row[0],
			Prompt:          row[1],
			ReferenceAnswer: row[2],
			Rubric:          row[3],
		})
	}
	return questions, nil
}

func ImportModelEvaluationQuestionSet(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, modelEvaluationMaxImportBytes)
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		common.ApiErrorMsg(c, "question file is required")
		return
	}
	defer func() { _ = file.Close() }()
	var questions []modelEvaluationQuestionInput
	switch strings.ToLower(filepath.Ext(header.Filename)) {
	case ".jsonl":
		questions, err = parseModelEvaluationJSONL(file)
	case ".xlsx":
		questions, err = parseModelEvaluationExcel(file)
	default:
		err = errors.New("only .jsonl and .xlsx files are supported")
	}
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	input := modelEvaluationQuestionSetInput{
		Name:        c.PostForm("name"),
		Description: c.PostForm("description"),
		Questions:   questions,
	}
	validated, err := validateModelEvaluationQuestionSetInput(input)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	name := strings.TrimSpace(input.Name)
	version, err := model.NextModelEvaluationQuestionSetVersion(name)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	set := model.ModelEvaluationQuestionSet{Name: name, Description: strings.TrimSpace(input.Description), Version: version, CreatedBy: c.GetInt("id")}
	if err := model.CreateModelEvaluationQuestionSet(&set, validated); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "model_evaluation.question_set_import", map[string]interface{}{"question_set_id": set.Id, "filename": filepath.Base(header.Filename), "question_count": len(validated)})
	created, err := model.GetModelEvaluationQuestionSet(set.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, created)
}

func GetModelEvaluationOptions(c *gin.Context) {
	channels := make([]model.Channel, 0)
	if err := model.DB.Where("status = ?", common.ChannelStatusEnabled).Order("id ASC").Find(&channels).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	options := modelEvaluationOptions{Models: make([]string, 0), Channels: make([]modelEvaluationChannelOption, 0), Groups: setting.GetUserUsableGroupsCopy()}
	modelSet := make(map[string]struct{})
	for _, channel := range channels {
		models := channel.GetModels()
		for _, modelName := range models {
			modelName = strings.TrimSpace(modelName)
			if modelName != "" {
				modelSet[modelName] = struct{}{}
			}
		}
		options.Channels = append(options.Channels, modelEvaluationChannelOption{Id: channel.Id, Name: channel.Name, Models: models, Groups: channel.GetGroups()})
	}
	for modelName := range modelSet {
		options.Models = append(options.Models, modelName)
	}
	sort.Strings(options.Models)
	common.ApiSuccess(c, options)
}

func ListModelEvaluationRuns(c *gin.Context) {
	runs, err := model.ListModelEvaluationRuns()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, runs)
}

func GetModelEvaluationRun(c *gin.Context) {
	id, err := parseModelEvaluationID(c, "id")
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	run, results, err := model.GetModelEvaluationRun(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, modelEvaluationRunDetail{Run: run, Results: results})
}

func validateModelEvaluationRunInput(input *modelEvaluationRunInput) error {
	input.Name = strings.TrimSpace(input.Name)
	input.ModelName = strings.TrimSpace(input.ModelName)
	input.GroupName = strings.TrimSpace(input.GroupName)
	if input.Name == "" || len([]rune(input.Name)) > 128 {
		return errors.New("evaluation name must contain 1 to 128 characters")
	}
	if input.QuestionSetId <= 0 || input.ModelName == "" {
		return errors.New("question set and model are required")
	}
	if input.GroupName == "" {
		input.GroupName = "default"
	}
	if input.Mode != modelEvaluationModeRouting && input.Mode != modelEvaluationModeFixedChannel {
		return errors.New("evaluation mode must be routing or fixed_channel")
	}
	if input.Mode == modelEvaluationModeFixedChannel && input.ChannelId <= 0 {
		return errors.New("channel is required for fixed-channel evaluation")
	}
	return nil
}

func StartModelEvaluationRun(c *gin.Context) {
	var input modelEvaluationRunInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		common.ApiErrorMsg(c, "invalid evaluation request")
		return
	}
	if err := validateModelEvaluationRunInput(&input); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if _, ok := setting.GetUserUsableGroupsCopy()[input.GroupName]; !ok {
		common.ApiErrorMsg(c, "selected group does not exist")
		return
	}
	set, err := model.GetModelEvaluationQuestionSet(input.QuestionSetId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if len(set.Questions) == 0 {
		common.ApiErrorMsg(c, "question set is empty")
		return
	}
	if input.Mode == modelEvaluationModeFixedChannel {
		channel, err := model.GetChannelById(input.ChannelId, true)
		if err != nil || channel.Status != common.ChannelStatusEnabled {
			common.ApiErrorMsg(c, "selected channel is unavailable")
			return
		}
		supported := false
		for _, modelName := range channel.GetModels() {
			if strings.TrimSpace(modelName) == input.ModelName {
				supported = true
				break
			}
		}
		if !supported {
			common.ApiErrorMsg(c, "selected channel does not support the model")
			return
		}
		groupSupported := false
		for _, groupName := range channel.GetGroups() {
			if strings.TrimSpace(groupName) == input.GroupName {
				groupSupported = true
				break
			}
		}
		if !groupSupported {
			common.ApiErrorMsg(c, "selected channel is unavailable to the group")
			return
		}
	}
	run := model.ModelEvaluationRun{
		Name:               input.Name,
		QuestionSetId:      set.Id,
		QuestionSetName:    set.Name,
		QuestionSetVersion: set.Version,
		ModelName:          input.ModelName,
		Mode:               input.Mode,
		ChannelId:          input.ChannelId,
		GroupName:          input.GroupName,
		Status:             model.ModelEvaluationRunStatusPending,
		TotalCount:         len(set.Questions),
		CreatedBy:          c.GetInt("id"),
	}
	results := make([]model.ModelEvaluationResult, 0, len(set.Questions))
	for _, question := range set.Questions {
		results = append(results, model.ModelEvaluationResult{
			QuestionId:      question.Id,
			Category:        question.Category,
			Prompt:          question.Prompt,
			ReferenceAnswer: question.ReferenceAnswer,
			Rubric:          question.Rubric,
			Status:          model.ModelEvaluationResultStatusPending,
		})
	}
	if err := model.CreateModelEvaluationRun(&run, results); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "model_evaluation.run_start", map[string]interface{}{"run_id": run.Id, "model": run.ModelName, "mode": run.Mode, "question_count": run.TotalCount})
	go executeModelEvaluationRun(run.Id, run.CreatedBy)
	common.ApiSuccess(c, run)
}

func selectModelEvaluationChannel(run *model.ModelEvaluationRun, userId int, retry int) (*model.Channel, string, error) {
	if run.Mode == modelEvaluationModeFixedChannel {
		channel, err := model.GetChannelById(run.ChannelId, true)
		return channel, run.GroupName, err
	}
	recorder := &responseWriterForSelection{header: make(http.Header)}
	ctx, _ := gin.CreateTestContext(recorder)
	cache, err := model.GetUserCache(userId)
	if err != nil {
		return nil, run.GroupName, err
	}
	cache.WriteContext(ctx)
	ctx.Set("id", userId)
	ctx.Set("group", run.GroupName)
	common.SetContextKey(ctx, "user_group", run.GroupName)
	return service.CacheGetRandomSatisfiedChannel(&service.RetryParam{Ctx: ctx, TokenGroup: run.GroupName, ModelName: run.ModelName, RequestPath: "/v1/chat/completions", Retry: &retry})
}

type responseWriterForSelection struct {
	header http.Header
}

func (w *responseWriterForSelection) Header() http.Header            { return w.header }
func (w *responseWriterForSelection) Write(data []byte) (int, error) { return len(data), nil }
func (w *responseWriterForSelection) WriteHeader(_ int)              {}

func executeModelEvaluationRun(runId int, userId int) {
	claimed, err := model.ClaimModelEvaluationRun(runId)
	if err != nil || !claimed {
		return
	}
	run, results, err := model.GetModelEvaluationRun(runId)
	if err != nil {
		_ = model.FinishModelEvaluationRun(runId, model.ModelEvaluationRunStatusFailed, err.Error())
		return
	}
	for index := range results {
		result := &results[index]
		executeModelEvaluationResult(context.Background(), run, result, userId)
		if err := model.UpdateModelEvaluationResult(result); err != nil {
			_ = model.FinishModelEvaluationRun(runId, model.ModelEvaluationRunStatusFailed, err.Error())
			return
		}
		_ = model.UpdateModelEvaluationRunProgress(runId)
	}
	if err := model.FinishModelEvaluationRun(runId, model.ModelEvaluationRunStatusCompleted, ""); err != nil {
		common.SysError("failed to finish model evaluation run: " + err.Error())
	}
}

func executeModelEvaluationResult(ctx context.Context, run *model.ModelEvaluationRun, result *model.ModelEvaluationResult, userId int) {
	maxTokens := uint(1024)
	request := &dto.GeneralOpenAIRequest{
		Model:         run.ModelName,
		Stream:        lo.ToPtr(true),
		StreamOptions: &dto.StreamOptions{IncludeUsage: true},
		Messages:      []dto.Message{{Role: "user", Content: result.Prompt}},
		MaxTokens:     lo.ToPtr(maxTokens),
	}
	maxRetries := 0
	if run.Mode == modelEvaluationModeRouting {
		maxRetries = common.RetryTimes
	}
	var lastError error
	for retry := 0; retry <= maxRetries; retry++ {
		channel, selectedGroup, err := selectModelEvaluationChannel(run, userId, retry)
		if err != nil || channel == nil {
			if err == nil {
				err = errors.New("no available channel")
			}
			lastError = err
			continue
		}
		test := testChannelWithOptions(ctx, channel, userId, run.ModelName, "", true, channelTestOptions{
			request:             request,
			maxResponseLogBytes: modelEvaluationMaxResponseBytes,
			recordConsumeLog:    true,
			logResponse:         false,
			group:               selectedGroup,
		})
		result.ChannelId = channel.Id
		result.ChannelName = channel.Name
		if test.localErr != nil {
			lastError = test.localErr
			continue
		}
		output, reasoning := extractModelEvaluationResponse(test.responseBody)
		if strings.TrimSpace(output) == "" {
			lastError = errors.New("model returned an empty response")
			continue
		}
		result.Output = output
		result.Reasoning = reasoning
		result.Status = model.ModelEvaluationResultStatusSuccess
		result.DurationMs = test.durationMs
		result.FirstTokenMs = test.firstTokenMs
		if test.usage != nil {
			result.PromptTokens = test.usage.PromptTokens
			result.CompletionTokens = test.usage.CompletionTokens
		}
		return
	}
	result.Status = model.ModelEvaluationResultStatusFailed
	if lastError != nil {
		result.ErrorMessage = lastError.Error()
	}
}

func extractModelEvaluationResponse(body []byte) (string, string) {
	trimmed := bytes.TrimSpace(body)
	if len(trimmed) == 0 {
		return "", ""
	}
	if trimmed[0] == '{' {
		output := gjson.GetBytes(trimmed, "choices.0.message.content").String()
		reasoning := gjson.GetBytes(trimmed, "choices.0.message.reasoning_content").String()
		if output == "" {
			output = gjson.GetBytes(trimmed, "output.0.content.0.text").String()
		}
		return output, reasoning
	}
	var output strings.Builder
	var reasoning strings.Builder
	scanner := bufio.NewScanner(bytes.NewReader(trimmed))
	scanner.Buffer(make([]byte, 64*1024), modelEvaluationMaxResponseBytes)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		output.WriteString(gjson.Get(payload, "choices.0.delta.content").String())
		reasoningChunk := gjson.Get(payload, "choices.0.delta.reasoning_content").String()
		if reasoningChunk == "" {
			reasoningChunk = gjson.Get(payload, "choices.0.delta.reasoning").String()
		}
		reasoning.WriteString(reasoningChunk)
	}
	return output.String(), reasoning.String()
}

func ScoreModelEvaluationResult(c *gin.Context) {
	runId, err := parseModelEvaluationID(c, "id")
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	resultId, err := parseModelEvaluationID(c, "result_id")
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	var input modelEvaluationScoreInput
	if err := common.DecodeJson(c.Request.Body, &input); err != nil {
		common.ApiErrorMsg(c, "invalid score request")
		return
	}
	input.Comment = strings.TrimSpace(input.Comment)
	if input.Score < 0 || input.Score > 5 || len([]rune(input.Comment)) > 2000 {
		common.ApiErrorMsg(c, "score must be 0 to 5 and comment must not exceed 2000 characters")
		return
	}
	if err := model.ScoreModelEvaluationResult(runId, resultId, input.Score, input.Comment); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "model_evaluation.result_score", map[string]interface{}{"run_id": runId, "result_id": resultId, "score": input.Score})
	common.ApiSuccess(c, nil)
}

func ExportModelEvaluationRunExcel(c *gin.Context) {
	runId, err := parseModelEvaluationID(c, "id")
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	run, results, err := model.GetModelEvaluationRun(runId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	file := excelize.NewFile()
	defer func() { _ = file.Close() }()
	sheet := "评测结果"
	defaultSheet := file.GetSheetName(0)
	_ = file.SetSheetName(defaultSheet, sheet)
	headers := []string{"序号", "类别", "问题", "参考答案", "评分标准", "模型输出", "推理内容", "状态", "错误", "渠道", "输入Token", "输出Token", "首Token延迟(ms)", "总耗时(ms)", "人工评分", "评语"}
	for column, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(column+1, 1)
		_ = file.SetCellValue(sheet, cell, header)
	}
	for rowIndex, result := range results {
		values := []interface{}{rowIndex + 1, result.Category, result.Prompt, result.ReferenceAnswer, result.Rubric, result.Output, result.Reasoning, result.Status, result.ErrorMessage, result.ChannelName, result.PromptTokens, result.CompletionTokens, result.FirstTokenMs, result.DurationMs, result.Score, result.Comment}
		for column, value := range values {
			cell, _ := excelize.CoordinatesToCellName(column+1, rowIndex+2)
			_ = file.SetCellValue(sheet, cell, value)
		}
	}
	headerStyle, _ := file.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Color: "FFFFFF"}, Fill: excelize.Fill{Type: "pattern", Color: []string{"2563EB"}, Pattern: 1}, Alignment: &excelize.Alignment{Vertical: "center"}})
	wrapStyle, _ := file.NewStyle(&excelize.Style{Alignment: &excelize.Alignment{Vertical: "top", WrapText: true}})
	_ = file.SetCellStyle(sheet, "A1", "P1", headerStyle)
	if len(results) > 0 {
		_ = file.SetCellStyle(sheet, "A2", fmt.Sprintf("P%d", len(results)+1), wrapStyle)
	}
	_ = file.SetColWidth(sheet, "A", "A", 8)
	_ = file.SetColWidth(sheet, "B", "B", 14)
	_ = file.SetColWidth(sheet, "C", "G", 42)
	_ = file.SetColWidth(sheet, "H", "P", 16)
	_ = file.SetPanes(sheet, &excelize.Panes{Freeze: true, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})
	summary := "报告概览"
	_, _ = file.NewSheet(summary)
	summaryRows := [][]interface{}{{"评测名称", run.Name}, {"模型", run.ModelName}, {"题库", fmt.Sprintf("%s v%d", run.QuestionSetName, run.QuestionSetVersion)}, {"模式", run.Mode}, {"分组", run.GroupName}, {"状态", run.Status}, {"成功题数", fmt.Sprintf("%d/%d", run.SuccessCount, run.TotalCount)}, {"平均评分", run.AverageScore}, {"平均耗时(ms)", run.AverageDurationMs}, {"输入Token", run.PromptTokens}, {"输出Token", run.CompletionTokens}, {"创建时间", run.CreatedAt.In(time.Local).Format("2006-01-02 15:04:05")}}
	for rowIndex, row := range summaryRows {
		_ = file.SetCellValue(summary, fmt.Sprintf("A%d", rowIndex+1), row[0])
		_ = file.SetCellValue(summary, fmt.Sprintf("B%d", rowIndex+1), row[1])
	}
	_ = file.SetColWidth(summary, "A", "A", 20)
	_ = file.SetColWidth(summary, "B", "B", 60)
	buffer, err := file.WriteToBuffer()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "model_evaluation.run_export", map[string]interface{}{"run_id": runId, "format": "xlsx"})
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=model-evaluation-%d.xlsx", runId))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}
