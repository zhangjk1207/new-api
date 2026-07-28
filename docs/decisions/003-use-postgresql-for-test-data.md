# ADR-003: Use independent PostgreSQL databases for test data

## Status

Accepted

## Date

2026-07-28

## Context

Production uses PostgreSQL for application data, usage logs, and conversation
audits. The 7992 test environment used SQLite for application data and logs,
while only conversation audits used PostgreSQL. Database-specific behavior,
migrations, locking, and query performance therefore could not be validated on
7992 before promoting the same image to production.

The existing test users, channels, tokens, settings, logs, health history,
host metrics, and vLLM metrics must be retained. The existing conversation
audit database must remain unchanged.

## Decision

Create `new_api_test` in the existing PostgreSQL instance and use it for both
`SQL_DSN` and `LOG_SQL_DSN` on 7992. Continue using the independent
`new_api_conversation_audit_test` database for `CONVERSATION_AUDIT_DSN`.

Migrate every non-internal SQLite table in one PostgreSQL transaction, verify
the copied row count for every table, and reset generated sequences. Preserve
the final SQLite database and checksum as a rollback artifact. Future test
deployments validate the PostgreSQL schema and create a PostgreSQL
custom-format backup instead of backing up the inactive SQLite file.

## Alternatives Considered

### Keep SQLite on 7992

This keeps the test deployment simple but leaves the main database behavior
different from production and weakens release confidence.

### Reuse the production database

This would match the database engine but mix test writes with production users,
channels, billing, logs, monitoring, and background tasks.

### Put application data and audits in one test database

This would reduce the number of databases but change the existing audit
deployment and couple large, long-lived payloads to application tables.

## Consequences

- 7990 and 7992 now use the same application and log database engine.
- Test and production remain isolated by database name and runtime credentials.
- Test conversation audits remain isolated from the application/log database.
- The historical SQLite file remains on disk but is no longer an active data
  source.
- PostgreSQL availability is now required for both environments.
