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
  AudioLines,
  BarChart3,
  Braces,
  FileText,
  ListOrdered,
  Mic2,
  MoveRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import type { MarketplaceItem } from '../types'

const ICONS = {
  document: FileText,
  audio: AudioLines,
  voice: Mic2,
  embedding: Braces,
  ranking: ListOrdered,
  chart: BarChart3,
}

type MarketplaceCardProps = {
  item: MarketplaceItem
  onSelect: (item: MarketplaceItem) => void
}

export function MarketplaceCard(props: MarketplaceCardProps) {
  const { t } = useTranslation()
  const Icon = ICONS[props.item.icon]
  const isReady = props.item.status === 'ready'

  return (
    <article
      role='button'
      tabIndex={0}
      onClick={() => props.onSelect(props.item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          props.onSelect(props.item)
        }
      }}
      className='group bg-background hover:border-primary/35 focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[240px] cursor-pointer flex-col rounded-lg border p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] focus-visible:ring-[3px] focus-visible:outline-none'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='bg-muted/35 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg border'>
          <Icon className='size-5' aria-hidden='true' />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground font-mono text-[11px]'>
            {props.item.version}
          </span>
          <Badge
            variant='outline'
            className={cn(
              'rounded-md px-1.5 py-0 text-[10px] font-medium',
              isReady
                ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300'
            )}
          >
            {t(isReady ? 'Ready' : 'Preview')}
          </Badge>
        </div>
      </div>

      <div className='mt-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          {t(props.item.categoryKey)}
        </p>
        <h2 className='mt-1 text-base font-semibold'>
          {t(props.item.nameKey)}
        </h2>
        <p className='text-muted-foreground mt-2 line-clamp-3 text-sm leading-6'>
          {t(props.item.descriptionKey)}
        </p>
      </div>

      <div className='mt-auto flex items-end justify-between gap-3 pt-5'>
        <div className='flex min-w-0 flex-wrap gap-1.5'>
          {props.item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className='bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5 text-[11px]'
            >
              {tag}
            </span>
          ))}
        </div>
        <span className='text-primary flex h-8 shrink-0 items-center gap-1 px-2 text-xs font-medium'>
          {t('Details')}
          <MoveRight className='size-3.5' aria-hidden='true' />
        </span>
      </div>
    </article>
  )
}
