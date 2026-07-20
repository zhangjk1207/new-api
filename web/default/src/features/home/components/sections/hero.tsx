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
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Boxes } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'

import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'

  const renderDocsButton = () => {
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          className='group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-lg px-5 text-sm font-medium'
          render={
            <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
          }
        >
          <BookOpen
            className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200'
            aria-hidden='true'
          />
          <span>{t('Docs')}</span>
        </Button>
      )
    }
    return (
      <Button
        variant='outline'
        className='group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-lg px-5 text-sm font-medium'
        render={<Link to={docsUrl} />}
      >
        <BookOpen
          className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200'
          aria-hidden='true'
        />
        <span>{t('Docs')}</span>
      </Button>
    )
  }

  return (
    <section className='bg-muted/25 relative overflow-hidden border-b px-6 py-16 sm:py-20 lg:py-24'>
      <div className='mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]'>
        <div className='relative z-10 max-w-2xl'>
          <p className='text-primary mb-4 text-sm font-semibold'>
            {t('Xingluo model service component')}
          </p>
          <h1 className='text-4xl leading-tight font-bold sm:text-5xl'>
            {t('Unify access, routing, and governance for every model capability')}
          </h1>
          <p className='text-muted-foreground mt-5 max-w-xl text-base leading-8'>
            {t(
              'Zhiqing provides internal business applications with unified management for multi-node local models and multi-channel model services, including compatible APIs, stable routing, operational monitoring, and call analysis.'
            )}
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            {props.isAuthenticated ? (
              <Button
                className='group h-11 rounded-lg px-5 text-sm font-medium'
                render={<Link to='/dashboard' />}
              >
                {t('Go to Dashboard')}
                <ArrowRight
                  className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5'
                  aria-hidden='true'
                />
              </Button>
            ) : (
              <Button
                className='group h-11 rounded-lg px-5 text-sm font-medium'
                render={<Link to='/sign-up' />}
              >
                {t('Get Started')}
                <ArrowRight
                  className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5'
                  aria-hidden='true'
                />
              </Button>
            )}
            <Button
              variant='outline'
              className='border-border/50 hover:border-border hover:bg-muted/50 h-11 gap-1.5 rounded-lg px-5 text-sm font-medium'
              render={<Link to='/pricing' />}
            >
              <Boxes className='size-4' aria-hidden='true' />
              {t('Browse models')}
            </Button>
            {renderDocsButton()}
          </div>
        </div>
        <HeroTerminalDemo className='min-w-0' />
      </div>
    </section>
  )
}
