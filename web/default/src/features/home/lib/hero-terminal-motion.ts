export const TERMINAL_TRANSITION_MS = 220

interface ManualProtocolSelection {
  activeIndex: number
  delayMs: number | null
  transitioning: boolean
}

export function resolveManualProtocolSelection(
  activeIndex: number,
  nextIndex: number,
  prefersReducedMotion: boolean
): ManualProtocolSelection {
  if (nextIndex === activeIndex) {
    return { activeIndex, delayMs: null, transitioning: false }
  }
  if (prefersReducedMotion) {
    return { activeIndex: nextIndex, delayMs: 0, transitioning: false }
  }
  return {
    activeIndex,
    delayMs: TERMINAL_TRANSITION_MS,
    transitioning: true,
  }
}
