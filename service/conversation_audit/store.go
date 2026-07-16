package conversationaudit

import (
	"fmt"
	"net/url"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/driver/clickhouse"
	"gorm.io/gorm"
)

const clickHouseDSNEnv = "CONVERSATION_AUDIT_CLICKHOUSE_DSN"

var databaseNamePattern = regexp.MustCompile(`^[A-Za-z0-9_]+$`)

var auditStore struct {
	sync.RWMutex
	value *store
}

type turnRow struct {
	EventTime        time.Time `gorm:"column:event_time"`
	RequestID        string    `gorm:"column:request_id"`
	ConversationID   string    `gorm:"column:conversation_id"`
	UserID           int       `gorm:"column:user_id"`
	Username         string    `gorm:"column:username"`
	TokenID          int       `gorm:"column:token_id"`
	TokenName        string    `gorm:"column:token_name"`
	ModelName        string    `gorm:"column:model_name"`
	ChannelID        int       `gorm:"column:channel_id"`
	ChannelName      string    `gorm:"column:channel_name"`
	ClientIP         string    `gorm:"column:client_ip"`
	RequestPath      string    `gorm:"column:request_path"`
	IsStream         uint8     `gorm:"column:is_stream"`
	Completed        uint8     `gorm:"column:completed"`
	EndReason        string    `gorm:"column:end_reason"`
	EndError         string    `gorm:"column:end_error"`
	StatusCode       uint16    `gorm:"column:status_code"`
	PromptTokens     int       `gorm:"column:prompt_tokens"`
	CompletionTokens int       `gorm:"column:completion_tokens"`
	FirstResponseMS  int64     `gorm:"column:first_response_ms"`
	DurationMS       int64     `gorm:"column:duration_ms"`
}

func (turnRow) TableName() string {
	return "conversation_turns"
}

type payloadRow struct {
	RequestID         string `gorm:"column:request_id"`
	RequestParamsJSON string `gorm:"column:request_params_json"`
	MessagesJSON      string `gorm:"column:messages_json"`
	ResponseContent   string `gorm:"column:response_content"`
	ReasoningContent  string `gorm:"column:reasoning_content"`
}

func (payloadRow) TableName() string {
	return "conversation_payloads"
}

type record struct {
	turn    turnRow
	payload payloadRow
}

type store struct {
	db    *gorm.DB
	queue chan record
}

// Init enables the optional, dedicated conversation audit store. It deliberately
// degrades to disabled when ClickHouse is unavailable so relaying remains intact.
func Init() {
	dsn := strings.TrimSpace(os.Getenv(clickHouseDSNEnv))
	if dsn == "" {
		return
	}

	db, err := openAuditDatabase(dsn)
	if err != nil {
		common.SysError("conversation audit storage disabled: " + err.Error())
		return
	}
	if err = migrateAuditDatabase(db); err != nil {
		common.SysError("conversation audit storage disabled: " + err.Error())
		return
	}

	newStore := &store{db: db, queue: make(chan record, 8192)}
	auditStore.Lock()
	auditStore.value = newStore
	auditStore.Unlock()
	go newStore.run()
	common.SysLog("conversation audit storage initialized")
}

func enabled() bool {
	auditStore.RLock()
	defer auditStore.RUnlock()
	return auditStore.value != nil
}

func enqueue(item record) {
	auditStore.RLock()
	current := auditStore.value
	auditStore.RUnlock()
	if current == nil {
		return
	}

	select {
	case current.queue <- item:
	default:
		go current.persist([]record{item})
	}
}

func (s *store) run() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	batch := make([]record, 0, 100)
	for {
		select {
		case item := <-s.queue:
			batch = append(batch, item)
			if len(batch) >= 100 {
				s.persist(batch)
				batch = batch[:0]
			}
		case <-ticker.C:
			if len(batch) > 0 {
				s.persist(batch)
				batch = batch[:0]
			}
		}
	}
}

func (s *store) persist(records []record) {
	turns := make([]turnRow, 0, len(records))
	payloads := make([]payloadRow, 0, len(records))
	for _, item := range records {
		turns = append(turns, item.turn)
		payloads = append(payloads, item.payload)
	}
	if err := s.db.Create(&turns).Error; err != nil {
		common.SysError("persist conversation audit turns: " + err.Error())
		return
	}
	if err := s.db.Create(&payloads).Error; err != nil {
		common.SysError("persist conversation audit payloads: " + err.Error())
	}
}

func openAuditDatabase(dsn string) (*gorm.DB, error) {
	databaseName, err := auditDatabaseNameFromDSN(dsn)
	if err != nil {
		return nil, err
	}
	parsed, err := url.Parse(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse conversation audit ClickHouse DSN: %w", err)
	}
	parsed.Path = "/default"
	parsed.RawPath = ""
	bootstrap, err := gorm.Open(clickhouse.Open(parsed.String()), &gorm.Config{PrepareStmt: false})
	if err != nil {
		return nil, fmt.Errorf("connect conversation audit ClickHouse: %w", err)
	}
	if err := bootstrap.Exec("CREATE DATABASE IF NOT EXISTS `" + databaseName + "`").Error; err != nil {
		return nil, fmt.Errorf("create conversation audit database: %w", err)
	}

	db, err := gorm.Open(clickhouse.Open(dsn), &gorm.Config{PrepareStmt: false})
	if err != nil {
		return nil, fmt.Errorf("connect conversation audit database: %w", err)
	}
	return db, nil
}

func auditDatabaseNameFromDSN(dsn string) (string, error) {
	parsed, err := url.Parse(dsn)
	if err != nil {
		return "", fmt.Errorf("parse conversation audit ClickHouse DSN: %w", err)
	}
	if parsed.Scheme != "clickhouse" && parsed.Scheme != "tcp" && parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", fmt.Errorf("conversation audit DSN must use a ClickHouse URL")
	}
	databaseName := strings.Trim(parsed.EscapedPath(), "/")
	if !databaseNamePattern.MatchString(databaseName) {
		return "", fmt.Errorf("conversation audit database name is invalid")
	}
	return databaseName, nil
}

func migrateAuditDatabase(db *gorm.DB) error {
	if err := db.Exec(`
CREATE TABLE IF NOT EXISTS conversation_turns (
	event_time DateTime64(3, 'Asia/Shanghai'),
	request_id String,
	conversation_id String,
	user_id Int32,
	username LowCardinality(String),
	token_id Int32,
	token_name String,
	model_name LowCardinality(String),
	channel_id Int32,
	channel_name String,
	client_ip String,
	request_path LowCardinality(String),
	is_stream UInt8,
	completed UInt8,
	end_reason LowCardinality(String),
	end_error String,
	status_code UInt16,
	prompt_tokens Int32,
	completion_tokens Int32,
	first_response_ms Int64,
	duration_ms Int64
) ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (conversation_id, event_time, request_id)`).Error; err != nil {
		return fmt.Errorf("create conversation audit turns table: %w", err)
	}
	if err := db.Exec(`
CREATE TABLE IF NOT EXISTS conversation_payloads (
	request_id String,
	request_params_json String CODEC(ZSTD(3)),
	messages_json String CODEC(ZSTD(3)),
	response_content String CODEC(ZSTD(3)),
	reasoning_content String CODEC(ZSTD(3))
) ENGINE = MergeTree
ORDER BY request_id`).Error; err != nil {
		return fmt.Errorf("create conversation audit payloads table: %w", err)
	}
	if err := db.Exec("ALTER TABLE conversation_payloads ADD COLUMN IF NOT EXISTS reasoning_content String CODEC(ZSTD(3))").Error; err != nil {
		return fmt.Errorf("add conversation audit reasoning column: %w", err)
	}
	if err := db.Exec("ALTER TABLE conversation_payloads DROP COLUMN IF EXISTS response_raw").Error; err != nil {
		return fmt.Errorf("drop conversation audit raw response column: %w", err)
	}
	if err := db.Exec("ALTER TABLE conversation_turns ADD COLUMN IF NOT EXISTS client_ip String").Error; err != nil {
		return fmt.Errorf("add conversation audit client IP column: %w", err)
	}
	return nil
}
