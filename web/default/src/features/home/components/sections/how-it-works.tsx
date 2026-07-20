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
import { ArrowRight, Plug, Send, Settings2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

const steps = [
  [
    'Connect resources',
    'Prepare local model nodes or external model services.',
  ],
  [
    'Configure channels',
    'Maintain models, groups, credentials, and routing policies.',
  ],
  [
    'Call through one API',
    'Business systems use model capabilities through a standard API.',
  ],
  [
    'Monitor and govern',
    'Continuously analyze service health, resources, and request paths.',
  ],
] as const

const stepIcons = {
  'Connect resources': Plug,
  'Configure channels': Settings2,
  'Call through one API': Send,
  'Monitor and govern': ShieldCheck,
} as const

export function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section className='border-border/60 bg-muted/25 relative z-10 border-y px-6 py-16 sm:py-20 lg:py-24'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 max-w-xl text-center sm:mx-auto'>
          <p className='text-primary mb-3 text-sm font-semibold'>
            {t('Access flow')}
          </p>
          <h2 className='text-2xl leading-tight font-bold sm:text-3xl'>
            {t('A clear path from model resources to governed service')}
          </h2>
        </AnimateInView>

        <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8'>
          {steps.map(([title, description], index) => {
            const Icon = stepIcons[title]
            const isLastStep = index === steps.length - 1

            return (
              <AnimateInView
                key={title}
                delay={index * 100}
                animation='fade-up'
                className='relative text-center'
              >
                {!isLastStep && (
                  <div
                    aria-hidden='true'
                    className='pointer-events-none absolute top-8 left-1/2 hidden h-px w-[calc(100%+2rem)] bg-border lg:block'
                  >
                    <ArrowRight className='text-muted-foreground absolute top-1/2 right-0 size-3 -translate-y-1/2 translate-x-1/2' />
                  </div>
                )}
                <div className='border-border/60 bg-background text-primary relative z-10 mx-auto mb-5 flex size-16 items-center justify-center rounded-lg border'>
                  <Icon className='size-6' strokeWidth={1.75} aria-hidden='true' />
                </div>
                <p className='text-primary mb-2 text-xs font-semibold'>
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className='text-sm font-semibold'>{t(title)}</h3>
                <p className='text-muted-foreground mx-auto mt-2 max-w-56 text-sm leading-6'>
                  {t(description)}
                </p>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
