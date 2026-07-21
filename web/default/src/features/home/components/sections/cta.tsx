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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()
  const primaryRoute = props.isAuthenticated ? '/dashboard' : '/sign-up'
  const primaryLabel = props.isAuthenticated
    ? t('Go to Dashboard')
    : t('Get Started')

  return (
    <section className='bg-primary text-primary-foreground relative z-10 px-6 py-16 sm:py-20 lg:py-24'>
      <AnimateInView
        className='mx-auto max-w-2xl text-center'
        animation='scale-in'
      >
        <h2 className='text-2xl leading-tight font-bold sm:text-3xl'>
          {t(
            'Keep every model capability reliable for every business scenario'
          )}
        </h2>
        <p className='text-primary-foreground/80 mx-auto mt-4 max-w-xl text-sm leading-6 sm:text-base'>
          {t(
            'Connect, route, monitor, and govern model services through one dependable platform.'
          )}
        </p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button
            className='group bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-11 px-5'
            render={<Link to={primaryRoute} />}
          >
            {primaryLabel}
            <ArrowRight
              className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5'
              aria-hidden='true'
            />
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
