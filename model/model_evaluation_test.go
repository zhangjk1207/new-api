package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupModelEvaluationTestDB(t *testing.T) {
	t.Helper()
	original := DB
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	require.NoError(t, db.AutoMigrate(&ModelEvaluationQuestionSet{}, &ModelEvaluationQuestion{}, &ModelEvaluationRun{}, &ModelEvaluationResult{}))
	t.Cleanup(func() {
		DB = original
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			_ = sqlDB.Close()
		}
	})
}

func TestSeedDefaultModelEvaluationQuestionSetIsIdempotent(t *testing.T) {
	setupModelEvaluationTestDB(t)
	require.NoError(t, SeedDefaultModelEvaluationQuestionSet())
	require.NoError(t, SeedDefaultModelEvaluationQuestionSet())

	sets, err := ListModelEvaluationQuestionSets()
	require.NoError(t, err)
	require.Len(t, sets, 1)
	assert.Equal(t, 1, sets[0].Version)
	assert.Len(t, sets[0].Questions, 10)
}

func TestUsedQuestionSetIsImmutable(t *testing.T) {
	setupModelEvaluationTestDB(t)
	set := &ModelEvaluationQuestionSet{Name: "baseline", Version: 1}
	require.NoError(t, CreateModelEvaluationQuestionSet(set, []ModelEvaluationQuestion{{Category: "general", Prompt: "question"}}))
	run := &ModelEvaluationRun{Name: "run", QuestionSetId: set.Id, QuestionSetName: set.Name, QuestionSetVersion: 1, ModelName: "model", Mode: "routing", GroupName: "default", Status: ModelEvaluationRunStatusPending, TotalCount: 1}
	require.NoError(t, CreateModelEvaluationRun(run, []ModelEvaluationResult{{QuestionId: 1, Category: "general", Prompt: "question", Status: ModelEvaluationResultStatusPending}}))

	set.Description = "changed"
	assert.Error(t, ReplaceModelEvaluationQuestions(set, []ModelEvaluationQuestion{{Category: "general", Prompt: "changed"}}))
	assert.Error(t, DeleteModelEvaluationQuestionSet(set.Id))
}

func TestEvaluationProgressAggregatesSuccessfulResults(t *testing.T) {
	setupModelEvaluationTestDB(t)
	run := &ModelEvaluationRun{Name: "run", QuestionSetId: 1, QuestionSetName: "set", QuestionSetVersion: 1, ModelName: "model", Mode: "routing", GroupName: "default", Status: ModelEvaluationRunStatusRunning, TotalCount: 2}
	require.NoError(t, CreateModelEvaluationRun(run, []ModelEvaluationResult{
		{Category: "one", Prompt: "one", Status: ModelEvaluationResultStatusSuccess, DurationMs: 100, PromptTokens: 10, CompletionTokens: 20, Score: 4},
		{Category: "two", Prompt: "two", Status: ModelEvaluationResultStatusFailed, Score: 2},
	}))
	require.NoError(t, UpdateModelEvaluationRunProgress(run.Id))

	updated, _, err := GetModelEvaluationRun(run.Id)
	require.NoError(t, err)
	assert.Equal(t, 2, updated.CompletedCount)
	assert.Equal(t, 1, updated.SuccessCount)
	assert.Equal(t, int64(100), updated.AverageDurationMs)
	assert.Equal(t, 10, updated.PromptTokens)
	assert.Equal(t, 20, updated.CompletionTokens)
	assert.Equal(t, 3.0, updated.AverageScore)
}
