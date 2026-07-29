import type { AgentSession } from '@earendil-works/pi-coding-agent'

import type { AgentRequestContext } from './types'

export type StoredSession = {
  session: AgentSession
  requestContext: AgentRequestContext
  identityKey: string
  modelKey: string
  touchedAt: number
}

export class SessionStore {
  private readonly sessions = new Map<string, StoredSession>()

  constructor(
    private readonly ttlMs: number,
    private readonly maxSessions: number
  ) {}

  get(
    id: string,
    identityKey: string,
    modelKey: string
  ): StoredSession | undefined {
    this.prune()
    const stored = this.sessions.get(id)
    if (
      !stored ||
      stored.identityKey !== identityKey ||
      stored.modelKey !== modelKey
    ) {
      return undefined
    }

    stored.touchedAt = Date.now()
    return stored
  }

  set(
    id: string,
    identityKey: string,
    session: AgentSession,
    requestContext: AgentRequestContext,
    modelKey: string
  ): StoredSession {
    this.prune()
    const existing = this.sessions.get(id)
    if (existing && existing.session !== session) existing.session.dispose()

    const stored = {
      session,
      requestContext,
      identityKey,
      modelKey,
      touchedAt: Date.now(),
    }
    this.sessions.set(id, stored)
    this.pruneOverflow()
    return stored
  }

  delete(id: string, identityKey: string): boolean {
    const stored = this.sessions.get(id)
    if (!stored || stored.identityKey !== identityKey) return false

    stored.session.dispose()
    return this.sessions.delete(id)
  }

  get size(): number {
    return this.sessions.size
  }

  private prune(): void {
    const expiresBefore = Date.now() - this.ttlMs
    for (const [id, stored] of this.sessions) {
      if (stored.touchedAt >= expiresBefore) continue
      stored.session.dispose()
      this.sessions.delete(id)
    }
  }

  private pruneOverflow(): void {
    while (this.sessions.size > this.maxSessions) {
      const oldest = [...this.sessions.entries()].sort(
        (left, right) => left[1].touchedAt - right[1].touchedAt
      )[0]
      if (!oldest) return

      oldest[1].session.dispose()
      this.sessions.delete(oldest[0])
    }
  }
}
