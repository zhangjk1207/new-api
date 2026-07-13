const DEFAULT_AUTH_REDIRECT = '/dashboard'

export function normalizeAuthRedirect(
  redirectTo?: string,
  origin = typeof window === 'undefined' ? undefined : window.location.origin
): string {
  if (!redirectTo) return DEFAULT_AUTH_REDIRECT

  if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    return redirectTo
  }
  if (!origin) return DEFAULT_AUTH_REDIRECT

  try {
    const target = new URL(redirectTo)
    if (target.origin !== origin) return DEFAULT_AUTH_REDIRECT
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return DEFAULT_AUTH_REDIRECT
  }
}
