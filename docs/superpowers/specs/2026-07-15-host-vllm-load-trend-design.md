# Host vLLM Load Trend Design

## Goal

Show a 24-hour vLLM load trend below GPU utilization for every monitored host.

## Data Model

The existing five-minute `VLLMMetricAggregate` records remain the source of truth. A host owns enabled channels whose configured base URL hostname matches the host address. For each matching channel and time bucket, the host trend sums output tokens per second, average running requests, and maximum queued requests. Channels that do not belong to the host are excluded.

## API

`GET /api/host-monitoring/summary` adds `vllm_history` to each host. Each point has `timestamp`, `output_tokens_per_second`, `running_requests`, and `waiting_requests`. The existing administrator authorization remains unchanged.

## User Experience

Each host detail displays a vLLM load trend directly below GPU utilization. It has one shared time axis, a left Y axis for output tokens per second, and a right Y axis for running and queued requests. The legend makes all three lines identifiable; the tooltip uses Asia/Shanghai time and formats each value with its unit.

## Constraints

- No new collector, persistence model, or request path is introduced.
- Missing native vLLM metrics remain absent instead of being synthesized from gateway logs.
- The existing service-status timeline and GPU trend remain unchanged.
