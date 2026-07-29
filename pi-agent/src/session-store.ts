import type { AgentSession } from '@earendil-works/pi-coding-agent'

export type StoredSession = {
  session: AgentSession
  identityKey: string
  touchedAt: number
}

export class SessionStore {
  private readonly sessions = new Map<string, StoredSession>()

  constructor(
    private readonly ttlMs: number,
    private readonly maxSessions: number
  ) {}

  get(id: string, identityKey: string): AgentSession | undefined {
    this.prune()
    const stored = this.sessions.get(id)
    if (!stored || stored.identityKey !== identityKey) return undefined

    stored.touchedAt = Date.now()
    return stored.session
  }

  set(id: string, identityKey: string, session: AgentSession): void {
    this.prune()
    const existing = this.sessions.get(id)
    if (existing && existing.session !== session) existing.session.dispose()

    this.sessions.set(id, { session, identityKey, touchedAt: Date.now() })
    this.pruneOverflow()
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
