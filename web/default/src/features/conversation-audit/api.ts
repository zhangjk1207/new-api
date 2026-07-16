/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { api } from '@/lib/api'

export type ConversationAuditTurn = {
  event_time: string
  request_id: string
  conversation_id: string
  user_id: number
  username: string
  token_id: number
  token_name: string
  model_name: string
  channel_id: number
  channel_name: string
  client_ip: string
  request_path: string
  is_stream: boolean
  completed: boolean
  end_reason: string
  end_error: string
  status_code: number
  prompt_tokens: number
  completion_tokens: number
  first_response_ms: number
  duration_ms: number
}

export type ConversationAuditPayload = {
  request_id: string
  request_params_json: string
  messages_json: string
  response_content: string
  reasoning_content: string
}

export type ConversationAuditListFilter = {
  page: number
  page_size: number
  start_at?: string
  end_at?: string
  username?: string
  token_name?: string
  model_name?: string
  conversation_id?: string
  client_ip?: string
}

type APIResponse<T> = { success: boolean; message: string; data: T }

export async function getConversationAudits(
  filter: ConversationAuditListFilter
) {
  const response = await api.get<
    APIResponse<{ items: ConversationAuditTurn[]; total: number }>
  >('/api/conversation-audits', { params: filter })
  return response.data.data
}

export async function getConversationAudit(requestID: string) {
  const response = await api.get<
    APIResponse<{
      turn: ConversationAuditTurn
      payload: ConversationAuditPayload
    }>
  >(`/api/conversation-audits/${encodeURIComponent(requestID)}`)
  return response.data.data
}
