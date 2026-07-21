# Zhiqing test deployment

This directory contains the Docker Compose deployment for the internal Zhiqing
test service on port 7992. Runtime secrets and the SQLite database remain under
`/data2/zhangjikang/work_dir/newapi_test_7992` and are never copied into the
image or committed to Git.

## Build and preflight

```bash
deploy/zhiqing/scripts/build-test.sh
deploy/zhiqing/scripts/preflight-test.sh
```

## Deploy

```bash
deploy/zhiqing/scripts/deploy-test.sh
```

## Roll back

```bash
deploy/zhiqing/scripts/rollback-test.sh
```

## Status

```bash
deploy/zhiqing/scripts/status-test.sh
```

The application container runs without proxy environment variables. Its
ClickHouse DSN is rewritten at runtime from `127.0.0.1` to the
`aisales-clickhouse` container on the external `clickhouse_default` network,
while the original `audit.env` remains unchanged for native-binary rollback.

Image builds use the host network with the signed Tsinghua Debian mirror,
`registry.npmmirror.com`, and `goproxy.cn`. The loopback proxy is not embedded
in the image, and all proxy variables are explicitly cleared from the runtime
container.
