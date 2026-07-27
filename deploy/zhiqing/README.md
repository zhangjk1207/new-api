# Zhiqing test and production deployment

This directory contains the Docker Compose deployments for the internal
Zhiqing test service on port 7992 and production service on port 7990. Build an
image once, verify it on 7992, and promote that exact image ID to 7990.

Runtime secrets and databases remain outside Git. Test runtime data is under
`/data2/zhangjikang/work_dir/newapi_test_7992`; production runtime configuration
is under `/data2/zhangjikang/work_dir/newapi_remote_10808`.

## Build and preflight

```bash
deploy/zhiqing/scripts/build-test.sh
deploy/zhiqing/scripts/preflight-test.sh
```

## Deploy test

```bash
deploy/zhiqing/scripts/deploy-test.sh
```

## Promote the tested image to production

The production scripts load the existing `SQL_DSN`, `LOG_SQL_DSN`,
`CONVERSATION_AUDIT_DSN`, and session secret from the 7990 runtime directory.
They never print or copy those values into Git.

```bash
deploy/zhiqing/scripts/preflight-prod.sh
deploy/zhiqing/scripts/deploy-prod.sh
deploy/zhiqing/scripts/status-prod.sh
```

`deploy-prod.sh` requires 7992 to be healthy on the requested image tag. It
backs up PostgreSQL, starts and checks the production app internally, switches
port 7990 from the native process to Nginx, and verifies that 7990 and 7992 use
the same image ID.

## Roll back test

```bash
deploy/zhiqing/scripts/rollback-test.sh
```

## Roll back production

```bash
deploy/zhiqing/scripts/rollback-prod.sh
```

The production rollback removes the production Compose project and restarts
the retained native binary.

## Status

```bash
deploy/zhiqing/scripts/status-test.sh
deploy/zhiqing/scripts/status-prod.sh
```

Application containers run without proxy environment variables. Test keeps its
SQLite application database and uses its configured PostgreSQL audit database.
Production uses the configured PostgreSQL DSNs for application data, logs, and
conversation audits.

Image builds use the host network with the signed Tsinghua Debian mirror,
`registry.npmmirror.com`, and `goproxy.cn`. The loopback proxy is not embedded
in the image, and all proxy variables are explicitly cleared from the runtime
container.
