export interface HomeApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export function getHomeSelfApiRequest() {
  return {
    skipBusinessError: true,
    disableDuplicate: true,
  } as const
}

export function unwrapHomeApiResponse<T>(
  response: HomeApiResponse<T>,
  fallbackMessage: string,
  emptyValue: T
): T
export function unwrapHomeApiResponse<T>(
  response: HomeApiResponse<T>,
  fallbackMessage: string
): T | undefined
export function unwrapHomeApiResponse<T>(
  response: HomeApiResponse<T>,
  fallbackMessage: string,
  emptyValue?: T
): T | undefined {
  if (!response.success) {
    throw new Error(response.message?.trim() || fallbackMessage)
  }

  return response.data ?? emptyValue
}
