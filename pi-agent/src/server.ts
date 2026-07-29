import { createHash, randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

import type { Model } from '@earendil-works/pi-ai'
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type AgentSession,
} from '@earendil-works/pi-coding-agent'

import { loadConfig } from './config'
import { NewApiClient } from './newapi-client'
import { createNewApiExtension } from './newapi-extension'
import { SessionStore } from './session-store'
import type { AgentChatRequest, ChatMessage, RequestIdentity } from './types'

const config = loadConfig()
const serviceRoot = resolve(import.meta.dir, '..')
const agentDir = resolve(serviceRoot, '.pi-agent')
const modelRuntime = await ModelRuntime.create({
  authPath: resolve(agentDir, 'auth.json'),
  modelsPath: resolve(agentDir, 'models.json'),
})
modelRuntime.setRuntimeApiKey('openai', config.newApiApiKey)

const sessionStore = new SessionStore(config.sessionTtlMs, config.maxSessions)
const encoder = new TextEncoder()
const internalRelayToken = randomUUID()
const toolNames = [
  'newapi_list_models',
  'newapi_list_groups',
  'newapi_get_account',
  'newapi_list_tokens',
  'newapi_api_request',
]

function createModel(
  modelName: string,
  group: string,
  identity: RequestIdentity
): Model<'openai-completions'> {
  return {
    id: modelName,
    name: modelName,
    api: 'openai-completions',
    provider: 'openai',
    baseUrl: `http://127.0.0.1:${config.port}/internal/openai/${internalRelayToken}/${encodeURIComponent(group)}/v1`,
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131_072,
    maxTokens: 8_192,
    headers: {
      'X-Pi-Agent-User': identity.userId,
      ...(identity.cookie ? { 'X-Pi-Agent-Cookie': identity.cookie } : {}),
    },
  }
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function openAiError(message: string, status = 400): Response {
  return jsonResponse(
    {
      error: {
        message,
        type: status >= 500 ? 'server_error' : 'invalid_request_error',
        code: 'pi_agent_error',
      },
    },
    status
  )
}

function readIdentity(request: Request): RequestIdentity | undefined {
  const userId = request.headers.get('New-Api-User')?.trim()
  if (!userId || !/^\d+$/.test(userId)) return undefined

  return {
    userId,
    authorization: request.headers.get('Authorization') || undefined,
    cookie: request.headers.get('Cookie') || undefined,
  }
}

function identityKey(
  identity: RequestIdentity
): string {
  return createHash('sha256')
    .update(
      `${identity.userId}\0${identity.authorization || ''}\0${identity.cookie || ''}`
    )
    .digest('hex')
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<ChatMessage>
  return (
    ['system', 'user', 'assistant'].includes(message.role || '') &&
    typeof message.content === 'string'
  )
}

function parseChatRequest(value: unknown): AgentChatRequest | undefined {
  if (!value || typeof value !== 'object') return undefined
  const candidate = value as Partial<AgentChatRequest>
  if (!Array.isArray(candidate.messages) || !candidate.messages.every(isChatMessage)) {
    return undefined
  }
  if (candidate.messages.length === 0 || candidate.messages.length > 200) {
    return undefined
  }
  if (
    candidate.session_id !== undefined &&
    !/^[a-zA-Z0-9_-]{8,128}$/.test(candidate.session_id)
  ) {
    return undefined
  }
  if (
    candidate.model !== undefined &&
    (typeof candidate.model !== 'string' ||
      candidate.model.length === 0 ||
      candidate.model.length > 200 ||
      /[\r\n]/.test(candidate.model))
  ) {
    return undefined
  }
  if (
    candidate.group !== undefined &&
    (typeof candidate.group !== 'string' ||
      candidate.group.length === 0 ||
      candidate.group.length > 64 ||
      /[\r\n]/.test(candidate.group))
  ) {
    return undefined
  }

  return {
    group: candidate.group,
    messages: candidate.messages,
    model: candidate.model,
    stream: candidate.stream !== false,
    session_id: candidate.session_id,
  }
}

async function createSession(
  client: NewApiClient,
  modelName: string,
  group: string,
  identity: RequestIdentity,
  requestContext: { latestUserPrompt: string }
): Promise<AgentSession> {
  const settingsManager = SettingsManager.inMemory({
    compaction: { enabled: true },
    retry: { enabled: true, maxRetries: 1 },
  })
  const resourceLoader = new DefaultResourceLoader({
    cwd: serviceRoot,
    agentDir,
    settingsManager,
    extensionFactories: [createNewApiExtension(client, requestContext)],
  })
  await resourceLoader.reload()

  const result = await createAgentSession({
    cwd: serviceRoot,
    agentDir,
    model: createModel(modelName, group, identity),
    modelRuntime,
    resourceLoader,
    sessionManager: SessionManager.inMemory(serviceRoot),
    settingsManager,
    thinkingLevel: 'off',
    tools: toolNames,
  })

  return result.session
}

async function handleInternalRelay(
  request: Request,
  token: string,
  group: string,
  endpoint: 'chat/completions' | 'responses'
): Promise<Response> {
  if (token !== internalRelayToken) {
    return new Response(null, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return openAiError('Internal relay received invalid JSON')
  }
  body.group = group

  const cookie = request.headers.get('X-Pi-Agent-Cookie')
  const userId = request.headers.get('X-Pi-Agent-User')
  const useUserSession = Boolean(cookie && userId)
  const targetPath = useUserSession ? `/pg/${endpoint}` : `/v1/${endpoint}`
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (useUserSession) {
    headers.set('Cookie', cookie!)
    headers.set('New-Api-User', userId!)
  } else {
    headers.set('Authorization', `Bearer ${config.newApiApiKey}`)
  }

  const response = await fetch(`${config.newApiBaseUrl}${targetPath}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: request.signal,
  })
  const responseHeaders = new Headers()
  const contentType = response.headers.get('Content-Type')
  if (contentType) responseHeaders.set('Content-Type', contentType)
  responseHeaders.set('Cache-Control', 'no-cache, no-transform')
  responseHeaders.set('X-Accel-Buffering', 'no')

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

function latestUserPrompt(messages: ChatMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') return messages[index].content.trim()
  }
  return undefined
}

function latestAssistantResult(session: AgentSession): {
  content: string
  error?: string
} {
  for (let index = session.messages.length - 1; index >= 0; index -= 1) {
    const message = session.messages[index]
    if (!message || typeof message !== 'object' || message.role !== 'assistant') {
      continue
    }

    const assistant = message as {
      content?: Array<{ type?: string; text?: string }>
      errorMessage?: string
    }
    const content = (assistant.content || [])
      .filter((item) => item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('')
    return { content, error: assistant.errorMessage }
  }

  return { content: '' }
}

function promptWithRestoredHistory(messages: ChatMessage[], prompt: string): string {
  let lastUserIndex = -1
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === 'user' && message.content.trim() === prompt) {
      lastUserIndex = index
      break
    }
  }
  if (lastUserIndex <= 0) return prompt

  const history = messages
    .slice(0, lastUserIndex)
    .filter((message) => message.role !== 'system' && message.content.trim())
    .map((message) => `${message.role === 'user' ? '用户' : '助手'}：${message.content}`)
    .join('\n\n')
  if (!history) return prompt

  const trimmedHistory = history.slice(-60_000)
  return `以下是这个会话此前的对话，仅作为上下文继续处理：\n\n${trimmedHistory}\n\n当前用户请求：${prompt}`
}

function sseChunk(
  id: string,
  modelName: string,
  content: string,
  finishReason: string | null
) {
  return `data: ${JSON.stringify({
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: modelName,
    choices: [
      {
        index: 0,
        delta: content ? { content } : {},
        finish_reason: finishReason,
      },
    ],
  })}\n\n`
}

async function handleChat(request: Request): Promise<Response> {
  const identity = readIdentity(request)
  if (!identity) return openAiError('Missing authenticated user identity', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return openAiError('Request body must be valid JSON')
  }

  const chatRequest = parseChatRequest(body)
  if (!chatRequest) return openAiError('Invalid chat completion request')

  const prompt = latestUserPrompt(chatRequest.messages)
  if (!prompt) return openAiError('A user message is required')

  const client = new NewApiClient(config.newApiBaseUrl, identity)
  const modelName = chatRequest.model || config.model
  const group = chatRequest.group || 'default'
  try {
    await client.get('/api/user/self')
    const models = await client.get(
      `/api/user/models?group=${encodeURIComponent(group)}`
    )
    if (!Array.isArray(models) || !models.includes(modelName)) {
      return openAiError(`Model ${modelName} is not available in group ${group}`, 403)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return openAiError(message, 401)
  }

  const sessionId = chatRequest.session_id || randomUUID()
  const ownerKey = identityKey(identity)
  const modelKey = `${modelName}\0${group}`
  let storedSession = sessionStore.get(sessionId, ownerKey, modelKey)
  let sessionWasCreated = false
  if (!storedSession) {
    try {
      const requestContext = { latestUserPrompt: prompt }
      const session = await createSession(
        client,
        modelName,
        group,
        identity,
        requestContext
      )
      storedSession = sessionStore.set(
        sessionId,
        ownerKey,
        session,
        requestContext,
        modelKey
      )
      sessionWasCreated = true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent initialization failed'
      return openAiError(message, 500)
    }
  }
  const { session, requestContext } = storedSession
  requestContext.latestUserPrompt = prompt
  const agentPrompt = sessionWasCreated
    ? promptWithRestoredHistory(chatRequest.messages, prompt)
    : prompt

  if (!chatRequest.stream) {
    let content = ''
    const unsubscribe = session.subscribe((event) => {
      if (
        event.type === 'message_update' &&
        event.assistantMessageEvent.type === 'text_delta'
      ) {
        content += event.assistantMessageEvent.delta
      }
    })

    try {
      await session.prompt(agentPrompt)
      const result = latestAssistantResult(session)
      if (result.error) throw new Error(result.error)
      if (!content) content = result.content
      return jsonResponse({
        id: `pi-${sessionId}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content },
            finish_reason: 'stop',
          },
        ],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent request failed'
      return openAiError(message, 502)
    } finally {
      unsubscribe()
    }
  }

  const completionId = `pi-${sessionId}-${Date.now()}`
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      let streamedContent = ''
      const close = () => {
        if (closed) return
        closed = true
        controller.enqueue(
          encoder.encode(sseChunk(completionId, modelName, '', 'stop'))
        )
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
      const unsubscribe = session.subscribe((event) => {
        if (
          event.type === 'message_update' &&
          event.assistantMessageEvent.type === 'text_delta'
        ) {
          streamedContent += event.assistantMessageEvent.delta
          controller.enqueue(
            encoder.encode(
              sseChunk(
                completionId,
                modelName,
                event.assistantMessageEvent.delta,
                null
              )
            )
          )
        }
      })

      void session
        .prompt(agentPrompt)
        .then(() => {
          const result = latestAssistantResult(session)
          if (result.error) throw new Error(result.error)
          if (!streamedContent && result.content) {
            controller.enqueue(
              encoder.encode(
                sseChunk(completionId, modelName, result.content, null)
              )
            )
          }
        })
        .catch((error: unknown) => {
          if (closed) return
          const message =
            error instanceof Error ? error.message : 'Agent request failed'
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: {
                  message,
                  type: 'server_error',
                  code: 'pi_agent_error',
                },
              })}\n\n`
            )
          )
        })
        .finally(() => {
          unsubscribe()
          close()
        })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Agent-Session-Id': sessionId,
    },
  })
}

const server = Bun.serve({
  port: config.port,
  idleTimeout: 255,
  async fetch(request) {
    const url = new URL(request.url)

    const internalRelayMatch = url.pathname.match(
      /^\/internal\/openai\/([^/]+)\/([^/]+)(?:\/v1)?\/(chat\/completions|responses)$/
    )
    if (request.method === 'POST' && internalRelayMatch) {
      return handleInternalRelay(
        request,
        internalRelayMatch[1],
        decodeURIComponent(internalRelayMatch[2]),
        internalRelayMatch[3] as 'chat/completions' | 'responses'
      )
    }
    if (url.pathname.startsWith('/internal/openai/')) {
      console.warn(
        `Unmatched internal relay path: ${url.pathname.replace(internalRelayToken, '[token]')}`
      )
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        model: config.model,
        sessions: sessionStore.size,
      })
    }

    if (request.method === 'POST' && url.pathname === '/v1/chat/completions') {
      return handleChat(request)
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/v1/sessions/')) {
      const identity = readIdentity(request)
      if (!identity) return openAiError('Missing authenticated user identity', 401)

      const sessionId = decodeURIComponent(url.pathname.slice('/v1/sessions/'.length))
      if (!/^[a-zA-Z0-9_-]{8,128}$/.test(sessionId)) {
        return openAiError('Invalid session ID')
      }

      sessionStore.delete(sessionId, identityKey(identity))
      return new Response(null, { status: 204 })
    }

    return jsonResponse({ message: 'Not found' }, 404)
  },
})

console.log(`Zhiqing Pi Agent listening on http://0.0.0.0:${server.port}`)
