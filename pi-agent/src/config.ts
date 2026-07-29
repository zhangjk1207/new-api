export type AgentConfig = {
  port: number
  newApiBaseUrl: string
  newApiApiKey: string
  model: string
  group: string
  sessionTtlMs: number
  maxSessions: number
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AgentConfig {
  const newApiBaseUrl = env.NEWAPI_BASE_URL?.replace(/\/$/, '')
  const newApiApiKey = env.NEWAPI_API_KEY?.trim()
  const model = env.NEWAPI_MODEL?.trim()

  if (!newApiBaseUrl) throw new Error('NEWAPI_BASE_URL is required')
  if (!newApiApiKey) throw new Error('NEWAPI_API_KEY is required')
  if (!model) throw new Error('NEWAPI_MODEL is required')

  return {
    port: positiveInteger(env.PORT, 7994),
    newApiBaseUrl,
    newApiApiKey,
    model,
    group: env.NEWAPI_GROUP?.trim() || 'default',
    sessionTtlMs:
      positiveInteger(env.AGENT_SESSION_TTL_MINUTES, 60) * 60 * 1000,
    maxSessions: positiveInteger(env.AGENT_MAX_SESSIONS, 100),
  }
}
