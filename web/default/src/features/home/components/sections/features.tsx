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
import {
  Activity,
  ChartNoAxesCombined,
  Cpu,
  Network,
  Route,
  Server,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

const features = [
  [
    'Unified model gateway',
    'Serve different model protocols and upstream services through one compatible interface.',
  ],
  [
    'Local model access',
    'Connect multi-node vLLM model services and manage model-channel relationships centrally.',
  ],
  [
    'Multi-channel intelligent routing',
    'Route requests by group, priority, and availability with automatic failover.',
  ],
  [
    'Service status monitoring',
    'Review 24-hour availability, success rate, response latency, and status timelines.',
  ],
  [
    'Resource and engine monitoring',
    'Track CPU, memory, GPU, vLLM concurrency, queueing, and cache metrics.',
  ],
  [
    'Call analysis and request-path audit',
    'Analyze usage by user, key, and model while retaining auditable request paths.',
  ],
] as const

const featureIcons = {
  'Unified model gateway': Network,
  'Local model access': Server,
  'Multi-channel intelligent routing': Route,
  'Service status monitoring': Activity,
  'Resource and engine monitoring': Cpu,
  'Call analysis and request-path audit': ChartNoAxesCombined,
} as const

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 px-6 py-16 sm:py-20 lg:py-24'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-10 max-w-xl sm:mb-12'>
          <p className='text-primary mb-3 text-sm font-semibold'>
            {t('Core capabilities')}
          </p>
          <h2 className='text-2xl leading-tight font-bold sm:text-3xl'>
            {t('Operate every model service from one control plane')}
          </h2>
        </AnimateInView>

        <div className='border-border/60 bg-border/60 grid gap-px overflow-hidden rounded-lg border md:grid-cols-2 lg:grid-cols-3'>
          {features.map(([title, description], index) => {
            const Icon = featureIcons[title]

            return (
              <AnimateInView
                key={title}
                delay={index * 75}
                animation='fade-up'
                className='bg-background p-6 sm:p-7'
              >
                <Icon
                  className='text-primary mb-5 size-5'
                  strokeWidth={1.75}
                  aria-hidden='true'
                />
                <h3 className='text-sm font-semibold'>{t(title)}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
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
