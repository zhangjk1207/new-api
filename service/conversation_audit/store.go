package conversationaudit

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const auditDSNEnv = "CONVERSATION_AUDIT_DSN"

var auditStore struct {
	sync.RWMutex
	value *store
}

type turnRow struct {
	EventTime        time.Time `gorm:"column:event_time;index:idx_conversation_turns_event_time;index:idx_conversation_turns_conversation_time,priority:2"`
	RequestID        string    `gorm:"column:request_id;size:128;index:idx_conversation_turns_request_id"`
	ConversationID   string    `gorm:"column:conversation_id;size:255;index:idx_conversation_turns_conversation_time,priority:1"`
	UserID           int       `gorm:"column:user_id"`
	Username         string    `gorm:"column:username;size:255"`
	TokenID          int       `gorm:"column:token_id"`
	TokenName        string    `gorm:"column:token_name;size:255"`
	ModelName        string    `gorm:"column:model_name;size:255"`
	ChannelID        int       `gorm:"column:channel_id"`
	ChannelName      string    `gorm:"column:channel_name;size:255"`
	ClientIP         string    `gorm:"column:client_ip;size:64"`
	RequestPath      string    `gorm:"column:request_path;size:255"`
	IsStream         uint8     `gorm:"column:is_stream"`
	Completed        uint8     `gorm:"column:completed"`
	EndReason        string    `gorm:"column:end_reason;size:64"`
	EndError         string    `gorm:"column:end_error;type:text"`
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
	RequestID         string `gorm:"column:request_id;size:128;index:idx_conversation_payloads_request_id"`
	RequestParamsJSON string `gorm:"column:request_params_json;type:text"`
	MessagesJSON      string `gorm:"column:messages_json;type:text"`
	ResponseContent   string `gorm:"column:response_content;type:text"`
	ReasoningContent  string `gorm:"column:reasoning_content;type:text"`
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
// degrades to disabled when its SQL database is unavailable so relaying remains intact.
func Init() {
	dsn := strings.TrimSpace(os.Getenv(auditDSNEnv))
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
	config := &gorm.Config{PrepareStmt: true}
	var dialector gorm.Dialector
	switch {
	case strings.HasPrefix(dsn, "postgres://"), strings.HasPrefix(dsn, "postgresql://"):
		dialector = postgres.New(postgres.Config{DSN: dsn, PreferSimpleProtocol: true})
	case strings.HasPrefix(dsn, "sqlite://"):
		dialector = sqlite.Open(strings.TrimPrefix(dsn, "sqlite://"))
	case strings.HasPrefix(dsn, "clickhouse://"), strings.HasPrefix(dsn, "tcp://"):
		return nil, fmt.Errorf("conversation audit ClickHouse DSNs are no longer supported")
	default:
		if !strings.Contains(dsn, "parseTime") {
			separator := "?"
			if strings.Contains(dsn, "?") {
				separator = "&"
			}
			dsn += separator + "parseTime=true"
		}
		dialector = mysql.Open(dsn)
	}

	db, err := gorm.Open(dialector, config)
	if err != nil {
		return nil, fmt.Errorf("connect conversation audit database: %w", err)
	}
	return db, nil
}

func migrateAuditDatabase(db *gorm.DB) error {
	if err := db.AutoMigrate(&turnRow{}, &payloadRow{}); err != nil {
		return fmt.Errorf("migrate conversation audit database: %w", err)
	}
	return nil
}
