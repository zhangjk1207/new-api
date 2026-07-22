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
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Badge } from '@/components/ui/badge'

import type { MarketplaceItem } from '../types'

type MarketplaceDetailsDialogProps = {
  item: MarketplaceItem | null
  onClose: () => void
}

export function MarketplaceDetailsDialog(props: MarketplaceDetailsDialogProps) {
  const { t } = useTranslation()
  const item = props.item

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      title={item ? t(item.nameKey) : ''}
      description={item ? t(item.descriptionKey) : ''}
      contentClassName='sm:max-w-2xl'
      contentHeight='auto'
    >
      {item ? (
        <div className='space-y-5'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline'>{t(item.categoryKey)}</Badge>
            <Badge variant='outline'>{item.version}</Badge>
            <Badge variant='outline'>
              {t(item.status === 'ready' ? 'Ready' : 'Preview')}
            </Badge>
          </div>

          <dl className='bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3'>
            {[
              ['Input', item.inputKey],
              ['Output', item.outputKey],
              ['Delivery', item.deliveryKey],
            ].map(([label, value]) => (
              <div key={label} className='bg-background p-4'>
                <dt className='text-muted-foreground text-xs'>{t(label)}</dt>
                <dd className='mt-1 text-sm font-medium'>{t(value)}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h3 className='text-sm font-semibold'>{t('Capability tags')}</h3>
            <div className='mt-2 flex flex-wrap gap-2'>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className='bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs'
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className='text-muted-foreground border-t pt-4 text-xs'>
            {t(
              'This is preview data. Access instructions and live availability will be connected later.'
            )}
          </p>
        </div>
      ) : null}
    </Dialog>
  )
}
