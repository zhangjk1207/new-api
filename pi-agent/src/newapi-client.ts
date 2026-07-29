import type { RequestIdentity } from './types'

type NewApiEnvelope = {
  success?: boolean
  message?: string
  data?: unknown
}

export class NewApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly identity: RequestIdentity
  ) {}

  async get(path: string): Promise<unknown> {
    const headers = new Headers({
      'New-Api-User': this.identity.userId,
    })

    if (this.identity.authorization) {
      headers.set('Authorization', this.identity.authorization)
    }
    if (this.identity.cookie) headers.set('Cookie', this.identity.cookie)

    const response = await fetch(`${this.baseUrl}${path}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    const text = await response.text()

    if (!response.ok) {
      throw new Error(`New API request failed with HTTP ${response.status}`)
    }

    let payload: NewApiEnvelope
    try {
      payload = JSON.parse(text) as NewApiEnvelope
    } catch {
      throw new Error('New API returned an invalid JSON response')
    }

    if (payload.success === false) {
      throw new Error(payload.message || 'New API request failed')
    }

    return payload.data
  }
}
