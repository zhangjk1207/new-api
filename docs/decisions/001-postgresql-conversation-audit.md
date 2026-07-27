# ADR-001: Store conversation audits in SQL databases

## Status

Accepted

## Date

2026-07-27

## Context

The conversation audit feature originally required a dedicated ClickHouse
deployment. The isolated deployment needs fewer container images and already
uses PostgreSQL for durable relational storage. Audit writes are asynchronous
and batched, while the administrator UI performs bounded, filtered queries.

## Decision

Use `CONVERSATION_AUDIT_DSN` for a dedicated SQL audit database. The store uses
GORM migrations and supports PostgreSQL, MySQL, and SQLite. The isolated and
test deployments use a separate PostgreSQL database in the existing PostgreSQL
instance.

Keep audit writes on the existing asynchronous queue so an unavailable audit
database never blocks model relaying. Store request and response payloads as
text and index request IDs, event time, and the conversation timeline.

## Alternatives Considered

### ClickHouse

ClickHouse is efficient for high-volume analytics, but requires another large
offline image and a separate operational data store.

### Main application database

Using the main database would reduce configuration, but couples large audit
payload growth to user, channel, token, and billing data. A separate database
in the same PostgreSQL instance keeps backup and capacity management isolated.

## Consequences

- Offline deployments require only one PostgreSQL server for application,
  usage-log, and audit databases.
- Existing ClickHouse audit records require a one-time migration.
- Long-range analytics may be slower than ClickHouse at very high data volume.
- The audit database can be moved independently without changing the primary
  application database.
