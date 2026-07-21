import { isLikelyHtml } from '@/lib/content-format'

export type DefaultHomeSection =
  | 'hero'
  | 'stats'
  | 'features'
  | 'operation-overview'
  | 'how-it-works'
  | 'cta'
  | 'footer'

type HomeComposition =
  | { kind: 'loading' }
  | { kind: 'custom-url'; content: string }
  | { kind: 'custom-html'; content: string }
  | { kind: 'custom-markdown'; content: string }
  | {
      kind: 'default'
      isAuthenticated: boolean
      sections: DefaultHomeSection[]
    }

interface ResolveHomeCompositionInput {
  content: string
  isAuthenticated: boolean
  isLoaded: boolean
  isUrl: boolean
}

const GUEST_SECTIONS: DefaultHomeSection[] = [
  'hero',
  'stats',
  'features',
  'how-it-works',
  'cta',
  'footer',
]

const AUTHENTICATED_SECTIONS: DefaultHomeSection[] = [
  'hero',
  'stats',
  'features',
  'operation-overview',
  'how-it-works',
  'cta',
  'footer',
]

export function resolveHomeComposition(
  input: ResolveHomeCompositionInput
): HomeComposition {
  if (!input.isLoaded) return { kind: 'loading' }

  if (input.content) {
    if (input.isUrl) return { kind: 'custom-url', content: input.content }
    if (isLikelyHtml(input.content)) {
      return { kind: 'custom-html', content: input.content }
    }
    return { kind: 'custom-markdown', content: input.content }
  }

  return {
    kind: 'default',
    isAuthenticated: input.isAuthenticated,
    sections: input.isAuthenticated
      ? [...AUTHENTICATED_SECTIONS]
      : [...GUEST_SECTIONS],
  }
}
