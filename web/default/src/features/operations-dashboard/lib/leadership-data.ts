/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
type LeadershipTrafficPoint = {
  timestamp: number
  successful_requests: number
  failed_requests: number
  total_tokens: number
  avg_latency_ms: number
  success_rate: number
}

export function buildRequestVolumeTrend(data: LeadershipTrafficPoint[]) {
  return data.flatMap((point) => [
    {
      timestamp: point.timestamp,
      series: 'success',
      value: point.successful_requests,
    },
    {
      timestamp: point.timestamp,
      series: 'failed',
      value: point.failed_requests,
    },
  ])
}

export function buildTokenUsageTrend(data: LeadershipTrafficPoint[]) {
  return data.map((point) => ({
    timestamp: point.timestamp,
    total_tokens: point.total_tokens,
  }))
}

export function labelTrendTimestamps<T extends { timestamp: number }>(
  data: T[],
  formatTimestamp: (timestamp: number) => string
) {
  return data.map((point) => ({
    ...point,
    timestamp_label: formatTimestamp(point.timestamp),
  }))
}

export function buildGatewayQualityTrend(data: LeadershipTrafficPoint[]) {
  return {
    latency: data.map((point) => ({
      timestamp: point.timestamp,
      avg_latency_ms: point.avg_latency_ms,
    })),
    successRate: data.map((point) => ({
      timestamp: point.timestamp,
      success_rate: point.success_rate,
    })),
  }
}
