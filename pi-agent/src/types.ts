export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type AgentChatRequest = {
  group?: string
  messages: ChatMessage[]
  model?: string
  stream?: boolean
  session_id?: string
}

export type RequestIdentity = {
  authorization?: string
  cookie?: string
  userId: string
}

export type AgentRequestContext = {
  latestUserPrompt: string
}
