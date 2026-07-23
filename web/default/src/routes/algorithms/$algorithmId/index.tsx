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
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlgorithmDetailsContent } from '@/features/algorithm-details'
import { getPublicAlgorithms } from '@/features/algorithm-management/api'

const SKELETON_KEYS = ['header', 'summary', 'content'] as const

function AlgorithmDetailsPage() {
  const { t } = useTranslation()
  const { algorithmId } = Route.useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['algorithms', 'public'],
    queryFn: getPublicAlgorithms,
    staleTime: 30_000,
  })
  const algorithm = query.data?.find((item) => item.name === algorithmId)
  const handleBack = () => navigate({ to: '/algorithms' })

  if (query.isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto w-full max-w-5xl space-y-4 px-4 sm:px-6'>
          {SKELETON_KEYS.map((key, index) => (
            <Skeleton
              key={key}
              className={index === 0 ? 'h-24 w-full' : 'h-40 w-full'}
            />
          ))}
        </div>
      </PublicLayout>
    )
  }

  if (!algorithm) {
    return (
      <PublicLayout>
        <div className='mx-auto max-w-2xl px-4 text-center sm:px-6'>
          <h1 className='text-base font-semibold'>
            {t('Algorithm not found')}
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t('The algorithm may have been disabled or removed.')}
          </p>
          <Button
            onClick={handleBack}
            variant='outline'
            size='sm'
            className='mt-4'
          >
            {t('Back to Algorithm Square')}
          </Button>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <main className='mx-auto w-full max-w-5xl px-4 sm:px-6'>
        <AlgorithmDetailsContent algorithm={algorithm} onBack={handleBack} />
      </main>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/algorithms/$algorithmId/')({
  component: AlgorithmDetailsPage,
})
