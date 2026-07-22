const APP_BASE_PATH_META_NAME = 'app-base-path'

export function normalizeRuntimeBasePath(value?: string | null): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed || trimmed === '/') return ''
  if (trimmed.includes('://') || trimmed.startsWith('//')) return ''

  const pathname = `/${trimmed.replaceAll(/^\/+|\/+$/g, '')}`
  return pathname === '/' ? '' : pathname
}

export function getRuntimeBasePath(
  documentRef: Pick<Document, 'querySelector'> | undefined = typeof document ===
  'undefined'
    ? undefined
    : document
): string {
  const meta = documentRef?.querySelector<HTMLMetaElement>(
    `meta[name="${APP_BASE_PATH_META_NAME}"]`
  )
  return normalizeRuntimeBasePath(meta?.content)
}

export function withRuntimeBasePath(
  path: string,
  basePath = getRuntimeBasePath()
): string {
  const normalizedBasePath = normalizeRuntimeBasePath(basePath)
  if (!normalizedBasePath || !path.startsWith('/') || path.startsWith('//')) {
    return path
  }
  if (
    path === normalizedBasePath ||
    path.startsWith(`${normalizedBasePath}/`)
  ) {
    return path
  }
  return `${normalizedBasePath}${path}`
}

export function getRuntimeOriginUrl(
  path: string,
  origin = typeof window === 'undefined' ? '' : window.location.origin,
  basePath = getRuntimeBasePath()
): string {
  if (!origin) return withRuntimeBasePath(path, basePath)
  return new URL(withRuntimeBasePath(path, basePath), origin).toString()
}

export function getRuntimeServerBaseUrl(
  origin = typeof window === 'undefined' ? '' : window.location.origin,
  basePath = getRuntimeBasePath()
): string {
  return `${origin}${normalizeRuntimeBasePath(basePath)}`
}
