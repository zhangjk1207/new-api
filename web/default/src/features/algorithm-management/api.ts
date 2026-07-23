/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { api } from '@/lib/api'

export type Algorithm = {
  id: number
  name: string
  display_name: string
  description: string
  category: string
  tags: string[]
  icon: string
  version: string
  enabled: boolean
  openapi_url: string
  base_url: string
  operation_id: string
  method: string
  path: string
  content_type: string
  request_schema: string
  timeout_seconds: number
  pricing_model: string
  price: number
  price_configured: boolean
}

export type OpenAPIOperation = {
  operation_id: string
  summary: string
  method: string
  path: string
  content_types: string[]
  request_schema?: Record<string, unknown>
}

export type OpenAPIImport = {
  title: string
  version: string
  openapi_url: string
  base_url: string
  operations: OpenAPIOperation[]
}

export type AlgorithmInput = {
  name: string
  display_name: string
  description: string
  category: string
  tags: string[]
  icon: string
  version: string
  enabled: boolean
  openapi_url: string
  base_url: string
  operation_id: string
  method: string
  path: string
  content_type: string
  request_schema?: Record<string, unknown>
  timeout_seconds: number
  price: number
}

type APIResponse<T> = { success: boolean; message: string; data: T }

function dataOrThrow<T>(response: APIResponse<T>): T {
  if (!response.success) throw new Error(response.message)
  return response.data
}

export async function getAlgorithms() {
  const response = await api.get<APIResponse<Algorithm[]>>('/api/algorithms')
  return dataOrThrow(response.data)
}

export async function getPublicAlgorithms() {
  const response = await api.get<APIResponse<Algorithm[]>>(
    '/api/algorithms/public'
  )
  return dataOrThrow(response.data)
}

export async function importOpenAPI(url: string) {
  const response = await api.post<APIResponse<OpenAPIImport>>(
    '/api/algorithms/import-openapi',
    { url }
  )
  return dataOrThrow(response.data)
}

export async function createAlgorithm(input: AlgorithmInput) {
  const response = await api.post<APIResponse<Algorithm>>(
    '/api/algorithms',
    input
  )
  return dataOrThrow(response.data)
}

export async function updateAlgorithm(id: number, input: AlgorithmInput) {
  const response = await api.put<APIResponse<Algorithm>>(
    `/api/algorithms/${id}`,
    input
  )
  return dataOrThrow(response.data)
}

export async function deleteAlgorithm(id: number) {
  const response = await api.delete<APIResponse<null>>(`/api/algorithms/${id}`)
  dataOrThrow(response.data)
}

export async function testAlgorithm(
  id: number,
  body: unknown,
  contentType: string
) {
  const response = await api.post(`/api/algorithms/${id}/test`, body, {
    headers:
      body instanceof FormData ? undefined : { 'Content-Type': contentType },
    responseType: 'text',
    validateStatus: () => true,
  })
  return {
    status: response.status,
    duration: Number(response.headers['x-algorithm-test-duration-ms'] ?? 0),
    data:
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2),
  }
}
