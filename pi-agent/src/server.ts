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

const model: Model<'openai-completions'> = {
  id: config.model,
  name: config.model,
  api: 'openai-completions',
  provider: 'openai',
  baseUrl: `${config.newApiBaseUrl}/v1`,
  reasoning: false,
  input: ['text'],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 131_072,
  maxTokens: 8_192,
}

const sessionStore = new SessionStore(config.sessionTtlMs, config.maxSessions)
const encoder = new TextEncoder()
const toolNames = [
  'newapi_list_models',
  'newapi_list_groups',
  'newapi_get_account',
  'newapi_list_tokens',
]

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

function identityKey(identity: RequestIdentity): string {
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

  return {
    messages: candidate.messages,
    stream: candidate.stream !== false,
    session_id: candidate.session_id,
  }
}

async function createSession(client: NewApiClient): Promise<AgentSession> {
  const settingsManager = SettingsManager.inMemory({
    compaction: { enabled: true },
    retry: { enabled: true, maxRetries: 1 },
  })
  const resourceLoader = new DefaultResourceLoader({
    cwd: serviceRoot,
    agentDir,
    settingsManager,
    extensionFactories: [createNewApiExtension(client)],
  })
  await resourceLoader.reload()

  const result = await createAgentSession({
    cwd: serviceRoot,
    agentDir,
    model,
    modelRuntime,
    resourceLoader,
    sessionManager: SessionManager.inMemory(serviceRoot),
    settingsManager,
    thinkingLevel: 'off',
    tools: toolNames,
  })

  return result.session
}

function latestUserPrompt(messages: ChatMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') return messages[index].content.trim()
  }
  return undefined
}

function sseChunk(id: string, content: string, finishReason: string | null) {
  return `data: ${JSON.stringify({
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: config.model,
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
  try {
    await client.get('/api/user/self')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return openAiError(message, 401)
  }

  const sessionId = chatRequest.session_id || randomUUID()
  const ownerKey = identityKey(identity)
  let session = sessionStore.get(sessionId, ownerKey)
  if (!session) {
    try {
      session = await createSession(client)
      sessionStore.set(sessionId, ownerKey, session)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent initialization failed'
      return openAiError(message, 500)
    }
  }

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
      await session.prompt(prompt)
      return jsonResponse({
        id: `pi-${sessionId}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: config.model,
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
      const close = () => {
        if (closed) return
        closed = true
        controller.enqueue(encoder.encode(sseChunk(completionId, '', 'stop')))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
      const unsubscribe = session.subscribe((event) => {
        if (
          event.type === 'message_update' &&
          event.assistantMessageEvent.type === 'text_delta'
        ) {
          controller.enqueue(
            encoder.encode(
              sseChunk(completionId, event.assistantMessageEvent.delta, null)
            )
          )
        }
      })

      void session
        .prompt(prompt)
        .catch((error: unknown) => {
          if (closed) return
          const message = error instanceof Error ? error.message : 'Agent request failed'
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: { message, type: 'server_error', code: 'pi_agent_error' },
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
