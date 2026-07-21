/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { RichContent } from '@/components/rich-content'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/theme-provider'
import { useAuthStore } from '@/stores/auth-store'

import { CTA } from './components/sections/cta'
import { Features } from './components/sections/features'
import { Hero } from './components/sections/hero'
import { HowItWorks } from './components/sections/how-it-works'
import { Stats } from './components/sections/stats'
import { useHomePageContent } from './hooks'
import { resolveHomeComposition } from './lib/home-composition'

const OperationOverview = lazy(() =>
  import('./components/sections/operation-overview').then(
    ({ OperationOverview }) => ({ default: OperationOverview })
  )
)

function OperationOverviewSkeleton() {
  return (
    <section
      className='border-border/60 bg-muted/20 relative z-10 border-y px-6 py-16 sm:py-20 lg:py-24'
      aria-hidden='true'
    >
      <div className='mx-auto max-w-6xl'>
        <Skeleton className='mb-10 h-16 w-48 motion-reduce:animate-none' />
        <div className='border-border/60 grid border-y sm:grid-cols-2 lg:grid-cols-4'>
          <Skeleton className='h-28 rounded-none border-b motion-reduce:animate-none sm:border-r lg:border-b-0' />
          <Skeleton className='h-28 rounded-none border-b motion-reduce:animate-none lg:border-r lg:border-b-0' />
          <Skeleton className='h-28 rounded-none border-b motion-reduce:animate-none sm:border-r sm:border-b-0 lg:border-r' />
          <Skeleton className='h-28 rounded-none motion-reduce:animate-none' />
        </div>
        <Skeleton className='mt-10 h-72 rounded-lg motion-reduce:animate-none' />
      </div>
    </section>
  )
}

export function Home() {
  const { i18n, t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { resolvedTheme } = useTheme()
  const { auth } = useAuthStore()
  const isAuthenticated = !!auth.user
  const { content, isLoaded, isUrl } = useHomePageContent()
  const composition = resolveHomeComposition({
    content,
    isAuthenticated,
    isLoaded,
    isUrl,
  })

  const syncIframePreferences = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { themeMode: resolvedTheme },
        '*'
      )
      iframeRef.current?.contentWindow?.postMessage(
        { lang: i18n.language },
        '*'
      )
    } catch {
      // Cross-origin frames may reject access while navigating.
    }
  }, [i18n.language, resolvedTheme])

  useEffect(() => {
    if (isUrl) {
      syncIframePreferences()
    }
  }, [isUrl, syncIframePreferences])

  if (composition.kind === 'loading') {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='flex min-h-screen items-center justify-center'>
          <div className='text-muted-foreground'>{t('Loading...')}</div>
        </main>
      </PublicLayout>
    )
  }

  if (composition.kind === 'custom-url') {
    return (
      <PublicLayout showMainContainer={false}>
        {/*
          allow-top-navigation-by-user-activation: the custom home page URL is
          admin-configured (trusted); this lets its target="_top" nav/menu links
          navigate the top-level window on user click. The default sandbox blocks
          this on desktop, while some mobile browsers allow it via allow-popups,
          causing inconsistent behavior. This token only permits user-activated
          top-level navigation and does NOT grant same-origin access.
        */}
        <iframe
          ref={iframeRef}
          src={composition.content}
          className='h-screen w-full border-none'
          title={t('Custom Home Page')}
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation-by-user-activation'
          onLoad={syncIframePreferences}
        />
      </PublicLayout>
    )
  }

  if (composition.kind === 'custom-html') {
    return (
      <PublicLayout showMainContainer={false}>
        <RichContent
          mode='html'
          htmlVariant='isolated'
          content={composition.content}
          className='custom-home-content'
        />
      </PublicLayout>
    )
  }

  if (composition.kind === 'custom-markdown') {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-6xl px-4 py-8'>
          <RichContent
            mode='markdown'
            content={composition.content}
            className='custom-home-content'
          />
        </div>
      </PublicLayout>
    )
  }

  const showOperationOverview =
    composition.sections.includes('operation-overview')

  return (
    <PublicLayout showMainContainer={false}>
      <Hero isAuthenticated={isAuthenticated} />
      <Stats />
      <Features />
      {showOperationOverview && auth.user && (
        <Suspense fallback={<OperationOverviewSkeleton />}>
          <OperationOverview userId={auth.user.id} />
        </Suspense>
      )}
      <HowItWorks />
      <CTA isAuthenticated={isAuthenticated} />
      <Footer />
    </PublicLayout>
  )
}
