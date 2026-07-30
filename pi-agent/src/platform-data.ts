type JsonRecord = Record<string, unknown>

type TokenUsageRow = {
  user_id?: number
  username?: string
  token_id?: number
  token_name?: string
  model_name?: string
  created_at?: number
  prompt_tokens?: number
  completion_tokens?: number
  token_used?: number
  count?: number
}

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function finiteNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}

export function summarizeAccount(accountValue: unknown, statusValue: unknown) {
  const account = record(accountValue)
  const status = record(statusValue)
  const quotaPerUnit = finiteNumber(status.quota_per_unit) || 500_000
  const displayType = String(status.quota_display_type || 'USD').toUpperCase()
  const exchangeRate =
    displayType === 'CNY'
      ? finiteNumber(status.usd_exchange_rate) || 1
      : displayType === 'CUSTOM'
        ? finiteNumber(status.custom_currency_exchange_rate) || 1
        : 1
  const currencyUnit =
    displayType === 'CNY'
      ? 'CNY'
      : displayType === 'CUSTOM'
        ? String(status.custom_currency_symbol || 'CUSTOM')
        : displayType

  const displayQuota = (quotaUnits: unknown) => {
    const units = finiteNumber(quotaUnits)
    if (displayType === 'TOKENS') {
      return { value: units, unit: 'quota units' }
    }
    return {
      value: rounded((units / quotaPerUnit) * exchangeRate),
      unit: currencyUnit,
    }
  }

  return {
    account: {
      id: account.id,
      username: account.username,
      display_name: account.display_name,
      role: account.role,
      status: account.status,
      group: account.group,
      request_count: finiteNumber(account.request_count),
    },
    quota: {
      remaining: displayQuota(account.quota),
      used: displayQuota(account.used_quota),
      display_basis: {
        quota_display_type: displayType,
        quota_per_unit: quotaPerUnit,
        usd_exchange_rate: exchangeRate,
      },
      meaning:
        '账户额度，已按平台当前额度展示配置换算；不是模型输入输出 Token 数。',
    },
  }
}

export function summarizeOperationsDashboard(value: unknown) {
  return {
    time_range: '最近 24 小时；网关实时指标为最近 15 分钟',
    units: {
      total_tokens_24h: 'tokens（真实输入 Token + 输出 Token）',
      token_used: 'tokens（真实输入 Token + 输出 Token）',
      gateway_success_rate_15m: '%',
      gateway_average_latency_ms_15m: 'ms',
      gateway_p95_latency_ms_15m: 'ms',
      output_tokens_per_second: 'token/s',
    },
    dashboard: value,
  }
}

export function summarizeTokenUsage(value: unknown) {
  const rows = Array.isArray(value) ? (value as TokenUsageRow[]) : []
  const breakdown = new Map<
    string,
    {
      user_id: number
      username: string
      token_id: number
      token_name: string
      model_name: string
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
      request_count: number
    }
  >()
  const totals = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    request_count: 0,
  }

  for (const row of rows) {
    const promptTokens = finiteNumber(row.prompt_tokens)
    const completionTokens = finiteNumber(row.completion_tokens)
    const totalTokens = promptTokens + completionTokens
    const requestCount = finiteNumber(row.count)
    const key = [
      row.user_id || 0,
      row.username || '',
      row.token_id || 0,
      row.token_name || '',
      row.model_name || '',
    ].join('\0')
    let item = breakdown.get(key)
    if (!item) {
      item = {
        user_id: row.user_id || 0,
        username: row.username || '',
        token_id: row.token_id || 0,
        token_name: row.token_name || '',
        model_name: row.model_name || '',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        request_count: 0,
      }
      breakdown.set(key, item)
    }
    item.prompt_tokens += promptTokens
    item.completion_tokens += completionTokens
    item.total_tokens += totalTokens
    item.request_count += requestCount
    totals.prompt_tokens += promptTokens
    totals.completion_tokens += completionTokens
    totals.total_tokens += totalTokens
    totals.request_count += requestCount
  }

  const items = [...breakdown.values()].sort(
    (left, right) => right.total_tokens - left.total_tokens
  )
  return {
    unit: 'tokens',
    meaning:
      'prompt_tokens、completion_tokens 和 total_tokens 均为模型实际 Token 数，不是账户额度或计费金额。',
    totals,
    breakdown: items.slice(0, 100),
    breakdown_total: items.length,
    breakdown_truncated: items.length > 100,
  }
}

export function tokenUsageTimeRange(
  startDate?: string,
  endDate?: string,
  now = new Date()
) {
  if (!startDate && !endDate) {
    return {
      startTimestamp: Math.floor(now.getTime() / 1000) - 24 * 60 * 60,
      endTimestamp: Math.floor(now.getTime() / 1000),
      label: '最近 24 小时',
    }
  }
  if (!startDate || !endDate) {
    throw new Error('start_date and end_date must be provided together')
  }
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    throw new Error('Dates must use YYYY-MM-DD')
  }
  const startTimestamp = Date.parse(`${startDate}T00:00:00+08:00`) / 1000
  const endTimestamp = Date.parse(`${endDate}T23:59:59+08:00`) / 1000
  if (
    !Number.isFinite(startTimestamp) ||
    !Number.isFinite(endTimestamp) ||
    endTimestamp < startTimestamp
  ) {
    throw new Error('Invalid date range')
  }
  if (endTimestamp - startTimestamp > 31 * 24 * 60 * 60) {
    throw new Error('Date range cannot exceed 31 days')
  }
  return {
    startTimestamp,
    endTimestamp,
    label: `${startDate} 至 ${endDate}（北京时间）`,
  }
}

const toolLabels: Record<string, string> = {
  newapi_list_models: '查询可用模型',
  newapi_list_groups: '查询用户分组',
  newapi_get_account: '查询账户信息',
  newapi_list_tokens: '查询 API 密钥',
  newapi_create_token: '创建 API 密钥',
  newapi_get_operations_dashboard: '查询运维大屏',
  newapi_get_token_usage: '查询 Token 使用统计',
  newapi_api_request: '调用平台管理接口',
}

export function toolTrace(toolName: string, state: 'start' | 'success' | 'error') {
  const label = toolLabels[toolName] || toolName
  if (state === 'start') return `正在调用工具：${label}...\n\n`
  if (state === 'error') return `工具调用失败：${label}。\n\n`
  return `工具调用完成：${label}。\n\n`
}
