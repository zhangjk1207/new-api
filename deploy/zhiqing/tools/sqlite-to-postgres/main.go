package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/glebarez/go-sqlite"
	"github.com/jackc/pgx/v5"
)

type column struct {
	name     string
	dataType string
}

type rowSource struct {
	rows    *sql.Rows
	columns []column
}

func (source *rowSource) Next() bool {
	return source.rows.Next()
}

func (source *rowSource) Values() ([]any, error) {
	values := make([]any, len(source.columns))
	destinations := make([]any, len(values))
	for i := range values {
		destinations[i] = &values[i]
	}
	if err := source.rows.Scan(destinations...); err != nil {
		return nil, err
	}
	for i, item := range values {
		converted, err := convertValue(item, source.columns[i].dataType)
		if err != nil {
			return nil, fmt.Errorf("convert column %s: %w", source.columns[i].name, err)
		}
		values[i] = converted
	}
	return values, nil
}

func (source *rowSource) Err() error {
	return source.rows.Err()
}

func main() {
	ctx := context.Background()
	sqlitePath := strings.TrimSpace(os.Getenv("SQLITE_SOURCE"))
	postgresDSN := strings.TrimSpace(os.Getenv("POSTGRES_DSN"))
	if sqlitePath == "" || postgresDSN == "" {
		log.Fatal("SQLITE_SOURCE and POSTGRES_DSN are required")
	}

	sqliteDB, err := sql.Open("sqlite", sqlitePath)
	if err != nil {
		log.Fatal(err)
	}
	defer sqliteDB.Close()
	if err = sqliteDB.PingContext(ctx); err != nil {
		log.Fatal(err)
	}

	postgresDB, err := pgx.Connect(ctx, postgresDSN)
	if err != nil {
		log.Fatal(err)
	}
	defer postgresDB.Close(ctx)

	tx, err := postgresDB.Begin(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer tx.Rollback(ctx)

	tables, err := sqliteTables(ctx, sqliteDB)
	if err != nil {
		log.Fatal(err)
	}
	quotedTables := make([]string, len(tables))
	for i, table := range tables {
		quotedTables[i] = quoteIdentifier(table)
	}
	if _, err = tx.Exec(ctx, "TRUNCATE TABLE "+strings.Join(quotedTables, ", ")+" CASCADE"); err != nil {
		log.Fatal(err)
	}

	for _, table := range tables {
		copied, copyErr := copySQLiteTable(ctx, sqliteDB, tx, table)
		if copyErr != nil {
			log.Fatalf("copy SQLite table %s: %v", table, copyErr)
		}
		sourceCount, countErr := sqliteTableCount(ctx, sqliteDB, table)
		if countErr != nil {
			log.Fatalf("count SQLite table %s: %v", table, countErr)
		}
		if copied != sourceCount {
			log.Fatalf("row count mismatch for %s: source=%d copied=%d", table, sourceCount, copied)
		}
		log.Printf("%-40s %d", table, copied)
	}

	if err = resetSequences(ctx, tx); err != nil {
		log.Fatal(err)
	}
	if err = tx.Commit(ctx); err != nil {
		log.Fatal(err)
	}
	log.Printf("migration committed")
}

func sqliteTables(ctx context.Context, db *sql.DB) ([]string, error) {
	rows, err := db.QueryContext(ctx, `
SELECT name FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tables []string
	for rows.Next() {
		var table string
		if err = rows.Scan(&table); err != nil {
			return nil, err
		}
		tables = append(tables, table)
	}
	return tables, rows.Err()
}

func copySQLiteTable(ctx context.Context, source *sql.DB, target pgx.Tx, table string) (int64, error) {
	columns, err := targetColumns(ctx, target, table)
	if err != nil {
		return 0, err
	}
	columnNames := make([]string, len(columns))
	quotedColumns := make([]string, len(columns))
	for i, item := range columns {
		columnNames[i] = item.name
		quotedColumns[i] = quoteIdentifier(item.name)
	}
	query := "SELECT " + strings.Join(quotedColumns, ", ") + " FROM " + quoteIdentifier(table)
	rows, err := source.QueryContext(ctx, query)
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	return target.CopyFrom(ctx, pgx.Identifier{table}, columnNames, &rowSource{rows: rows, columns: columns})
}

func sqliteTableCount(ctx context.Context, db *sql.DB, table string) (int64, error) {
	var count int64
	err := db.QueryRowContext(ctx, "SELECT count(*) FROM "+quoteIdentifier(table)).Scan(&count)
	return count, err
}

func targetColumns(ctx context.Context, tx pgx.Tx, table string) ([]column, error) {
	rows, err := tx.Query(ctx, `
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = $1
ORDER BY ordinal_position`, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var columns []column
	for rows.Next() {
		var item column
		if err = rows.Scan(&item.name, &item.dataType); err != nil {
			return nil, err
		}
		columns = append(columns, item)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if len(columns) == 0 {
		return nil, fmt.Errorf("target table %s has no columns", table)
	}
	return columns, nil
}

func convertValue(value any, dataType string) (any, error) {
	if value == nil {
		return nil, nil
	}
	if raw, ok := value.([]byte); ok && dataType != "bytea" {
		value = string(raw)
	}
	switch dataType {
	case "boolean":
		switch item := value.(type) {
		case bool:
			return item, nil
		case int64:
			return item != 0, nil
		case string:
			parsed, err := strconv.ParseBool(item)
			if err == nil {
				return parsed, nil
			}
			integer, intErr := strconv.ParseInt(item, 10, 64)
			if intErr != nil {
				return nil, err
			}
			return integer != 0, nil
		}
	case "timestamp with time zone", "timestamp without time zone":
		if _, ok := value.(time.Time); ok {
			return value, nil
		}
		text := fmt.Sprint(value)
		for _, layout := range []string{
			time.RFC3339Nano,
			"2006-01-02 15:04:05.999999999-07:00",
			"2006-01-02 15:04:05.999999999Z07:00",
			"2006-01-02 15:04:05.999999999",
			"2006-01-02 15:04:05",
		} {
			parsed, err := time.Parse(layout, text)
			if err == nil {
				return parsed, nil
			}
		}
		return nil, fmt.Errorf("unsupported timestamp %q", text)
	}
	return value, nil
}

func resetSequences(ctx context.Context, tx pgx.Tx) error {
	rows, err := tx.Query(ctx, `
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'
ORDER BY table_name, ordinal_position`)
	if err != nil {
		return err
	}
	var sequences [][2]string
	for rows.Next() {
		var item [2]string
		if err = rows.Scan(&item[0], &item[1]); err != nil {
			rows.Close()
			return err
		}
		sequences = append(sequences, item)
	}
	if err = rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()
	for _, item := range sequences {
		table := quoteIdentifier(item[0])
		column := quoteIdentifier(item[1])
		statement := fmt.Sprintf(
			"SELECT setval(pg_get_serial_sequence('%s', '%s'), COALESCE((SELECT MAX(%s) FROM %s), 1), EXISTS(SELECT 1 FROM %s))",
			strings.ReplaceAll(item[0], "'", "''"), strings.ReplaceAll(item[1], "'", "''"), column, table, table,
		)
		if _, err = tx.Exec(ctx, statement); err != nil {
			return err
		}
	}
	return nil
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}
