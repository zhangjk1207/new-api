import type { NewApiMethod } from './newapi-client'

const BLOCKED_PATHS = [
  /^\/api\/(?:oauth|setup|status\/test|user\/(?:login|register|reset|2fa))\b/i,
  /^\/api\/(?:channel|token)\/[^/]+\/key\b/i,
  /^\/api\/token\/batch\/keys\b/i,
]
const MUTATION_WORDS =
  /(?:创建|新增|修改|更新|设置|启用|禁用|停用|启动|停止|重启|测试|执行|删除|重置|清理|create|add|update|change|set|enable|disable|start|stop|restart|test|run|delete|reset|clean)/i
const CONFIRM_WORDS = /(?:确认|同意|执行|开始|可以|就这样|confirm|proceed|yes)/i
const DESTRUCTIVE_PATH = /(?:delete|reset|clean|purge|disable|stop|restart)/i
const SENSITIVE_KEYS =
  /^(?:key|token|password|secret|access_token|refresh_token|authorization|cookie|private_key|client_secret)$/i
const MAX_TOOL_RESULT_CHARS = 80_000

export function validateApiPath(path: string): string {
  if (!path.startsWith('/api/') || path.includes('..') || path.includes('#')) {
    throw new Error('Only relative New API paths under /api/ are allowed')
  }

  const parsed = new URL(path, 'http://new-api.local')
  if (parsed.origin !== 'http://new-api.local') {
    throw new Error('External URLs are not allowed')
  }
  if (BLOCKED_PATHS.some((pattern) => pattern.test(parsed.pathname))) {
    throw new Error('This endpoint is blocked because it may expose credentials')
  }

  return `${parsed.pathname}${parsed.search}`
}

export function assertMutationAllowed(
  method: NewApiMethod,
  path: string,
  latestUserPrompt: string
): void {
  if (method === 'GET') return
  if (!MUTATION_WORDS.test(latestUserPrompt)) {
    throw new Error('The user has not explicitly requested a write operation')
  }
  if (
    (method === 'DELETE' || DESTRUCTIVE_PATH.test(path)) &&
    !CONFIRM_WORDS.test(latestUserPrompt)
  ) {
    throw new Error('A destructive operation requires explicit user confirmation')
  }
}

export function sanitizeApiResult(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeApiResult)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.test(key) ? '[REDACTED]' : sanitizeApiResult(item),
    ])
  )
}

export function serializeToolResult(value: unknown): string {
  const serialized = JSON.stringify(sanitizeApiResult(value))
  if (serialized.length <= MAX_TOOL_RESULT_CHARS) return serialized
  return `${serialized.slice(0, MAX_TOOL_RESULT_CHARS)}\n...[truncated]`
}
