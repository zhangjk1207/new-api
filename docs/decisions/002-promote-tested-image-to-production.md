# ADR-002: Promote the tested container image to production

## Status

Accepted

## Date

2026-07-27

## Context

The test service on port 7992 runs in Docker Compose, while production on port
7990 runs as a native binary. Building each environment independently allows
the source revision, frontend assets, Go toolchain, and runtime dependencies to
drift. Production still needs the native binary as an immediate rollback path.

## Decision

Build the application image once from the 7992 release worktree. Deploy and
verify that image on 7992, then promote the exact same local image ID to the
7990 production Compose project. The production deployment must not build an
image.

Before promotion, verify that 7992 is healthy and that its running image ID
matches the requested tag. Validate production database access and create a
PostgreSQL custom-format backup. Start the production application container
before releasing port 7990, then stop the native process and start the
production Nginx container. If any step fails, remove the production Compose
project and restart the retained native binary.

Production and test keep separate runtime configuration and data. The image is
shared; database DSNs, session secrets, node names, volumes, ports, and Compose
networks are environment-specific.

## Alternatives Considered

### Continue native production deployment

This preserves the existing process but requires a second build and keeps the
runtime different from test, so it does not guarantee artifact parity.

### Build a production-specific image

This provides Docker packaging but does not prove that production runs the
artifact tested on 7992.

### Share test configuration and data with production

This would make the environments identical but would destroy isolation between
test and production users, channels, logs, and audits.

## Consequences

- 7990 and 7992 can be verified by Docker image ID rather than tag alone.
- Production configuration remains outside Git under the existing runtime
  directory.
- The native production binary remains available for rollback.
- The first Compose cutover still has a short port-switch interruption. A
  separate blue-green design is required for zero-downtime releases.
- Promoting the 7992 image also promotes all features and migrations in that
  tested revision; release review must cover the full commit range.
