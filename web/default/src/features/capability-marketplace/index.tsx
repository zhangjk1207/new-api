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
import { LayoutGrid, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { MarketplaceCard } from './components/marketplace-card'
import { MarketplaceDetailsDialog } from './components/marketplace-details-dialog'
import type { MarketplaceDefinition, MarketplaceItem } from './types'

type CapabilityMarketplaceProps = {
  definition: MarketplaceDefinition
}

export function CapabilityMarketplace(props: CapabilityMarketplaceProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)

  const categories = useMemo(
    () => [...new Set(props.definition.items.map((item) => item.categoryKey))],
    [props.definition.items]
  )

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return props.definition.items.filter((item) => {
      if (category !== 'all' && item.categoryKey !== category) return false
      if (!normalizedSearch) return true

      return [
        t(item.nameKey),
        t(item.descriptionKey),
        t(item.categoryKey),
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [category, props.definition.items, search, t])

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className='mx-auto w-full max-w-[1800px] px-4 pt-24 pb-12 sm:px-6 lg:px-8'>
        <header className='border-b pb-7'>
          <div className='flex flex-col justify-between gap-5 lg:flex-row lg:items-end'>
            <div className='max-w-3xl'>
              <div className='text-primary mb-3 flex items-center gap-2 text-xs font-semibold'>
                <LayoutGrid className='size-4' aria-hidden='true' />
                {t('Capability catalog')}
              </div>
              <h1 className='text-3xl font-bold sm:text-4xl'>
                {t(props.definition.titleKey)}
              </h1>
              <p className='text-muted-foreground mt-3 text-sm leading-6 sm:text-base'>
                {t(props.definition.subtitleKey)}
              </p>
            </div>

            <div className='relative w-full lg:w-[420px]'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(props.definition.searchPlaceholderKey)}
                className='h-10 pr-10 pl-9'
                aria-label={t(props.definition.searchPlaceholderKey)}
              />
              {search ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='absolute top-1/2 right-1 size-8 -translate-y-1/2'
                  onClick={() => setSearch('')}
                  aria-label={t('Clear search')}
                >
                  <X className='size-4' />
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <div className='mt-6 grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]'>
          <aside className='self-start xl:sticky xl:top-24'>
            <p className='text-sm font-semibold'>{t('Categories')}</p>
            <div className='mt-2 flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible'>
              {['all', ...categories].map((categoryKey) => {
                const isActive = category === categoryKey
                const label = categoryKey === 'all' ? t('All') : t(categoryKey)
                return (
                  <button
                    key={categoryKey}
                    type='button'
                    onClick={() => setCategory(categoryKey)}
                    className={cn(
                      'flex h-9 shrink-0 items-center justify-between rounded-md px-3 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span>{label}</span>
                    <span
                      className={cn(
                        'ml-4 text-xs',
                        isActive
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground/60'
                      )}
                    >
                      {categoryKey === 'all'
                        ? props.definition.items.length
                        : props.definition.items.filter(
                            (item) => item.categoryKey === categoryKey
                          ).length}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <main className='min-w-0'>
            <div className='mb-4 flex items-center justify-between gap-4'>
              <p className='text-sm font-semibold'>
                {t('{{count}} capabilities', { count: filteredItems.length })}
              </p>
              {!props.definition.live ? (
                <span className='text-muted-foreground text-xs'>
                  {t('Mock data')}
                </span>
              ) : null}
            </div>

            {filteredItems.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
                {filteredItems.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedItem}
                  />
                ))}
              </div>
            ) : (
              <div className='flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed text-center'>
                <Search className='text-muted-foreground/50 size-8' />
                <h2 className='mt-4 text-sm font-semibold'>
                  {t('No matching capabilities')}
                </h2>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('Try another keyword or category.')}
                </p>
              </div>
            )}
          </main>
        </div>
      </PageTransition>

      <MarketplaceDetailsDialog
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </PublicLayout>
  )
}
