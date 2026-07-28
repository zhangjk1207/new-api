/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { api } from '@/lib/api'

export type EvaluationQuestion = {
  id: number
  category: string
  prompt: string
  reference_answer: string
  rubric: string
}

export type EvaluationQuestionSet = {
  id: number
  name: string
  description: string
  version: number
  created_at: string
  questions: EvaluationQuestion[]
}

export type EvaluationRun = {
  id: number
  name: string
  question_set_id: number
  question_set_name: string
  question_set_version: number
  model_name: string
  mode: 'routing' | 'fixed_channel'
  channel_id: number
  group_name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  total_count: number
  completed_count: number
  success_count: number
  average_score: number
  average_duration_ms: number
  prompt_tokens: number
  completion_tokens: number
  error_message: string
  created_at: string
}

export type EvaluationResult = {
  id: number
  category: string
  prompt: string
  reference_answer: string
  rubric: string
  output: string
  reasoning: string
  status: 'pending' | 'success' | 'failed'
  error_message: string
  channel_name: string
  prompt_tokens: number
  completion_tokens: number
  duration_ms: number
  first_token_ms: number
  score: number
  comment: string
}

export type EvaluationOptions = {
  models: string[]
  channels: { id: number; name: string; models: string[]; groups: string[] }[]
  groups: Record<string, string>
}

type Response<T> = { success: boolean; message: string; data: T }

async function data<T>(request: Promise<{ data: Response<T> }>) {
  const response = await request
  if (!response.data.success) throw new Error(response.data.message)
  return response.data.data
}

export const getQuestionSets = () =>
  data(
    api.get<Response<EvaluationQuestionSet[]>>(
      '/api/model-evaluations/question-sets'
    )
  )

export const saveQuestionSet = (input: {
  id?: number
  name: string
  description: string
  questions: Omit<EvaluationQuestion, 'id'>[]
}) =>
  data(
    input.id
      ? api.put<Response<EvaluationQuestionSet>>(
          `/api/model-evaluations/question-sets/${input.id}`,
          input
        )
      : api.post<Response<EvaluationQuestionSet>>(
          '/api/model-evaluations/question-sets',
          input
        )
  )

export const importQuestionSet = (form: FormData) =>
  data(
    api.post<Response<EvaluationQuestionSet>>(
      '/api/model-evaluations/question-sets/import',
      form
    )
  )

export const deleteQuestionSet = (id: number) =>
  data(api.delete<Response<null>>(`/api/model-evaluations/question-sets/${id}`))

export const getEvaluationOptions = () =>
  data(api.get<Response<EvaluationOptions>>('/api/model-evaluations/options'))

export const getEvaluationRuns = () =>
  data(api.get<Response<EvaluationRun[]>>('/api/model-evaluations/runs'))

export const getEvaluationRun = (id: number) =>
  data(
    api.get<Response<{ run: EvaluationRun; results: EvaluationResult[] }>>(
      `/api/model-evaluations/runs/${id}`
    )
  )

export const startEvaluationRun = (input: {
  name: string
  question_set_id: number
  model_name: string
  mode: 'routing' | 'fixed_channel'
  channel_id: number
  group_name: string
}) =>
  data(api.post<Response<EvaluationRun>>('/api/model-evaluations/runs', input))

export const scoreEvaluationResult = (
  runID: number,
  resultID: number,
  score: number,
  comment: string
) =>
  data(
    api.put<Response<null>>(
      `/api/model-evaluations/runs/${runID}/results/${resultID}/score`,
      { score, comment }
    )
  )

export async function downloadEvaluationExcel(runID: number) {
  const response = await api.get(
    `/api/model-evaluations/runs/${runID}/export.xlsx`,
    { responseType: 'blob' }
  )
  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `model-evaluation-${runID}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}
