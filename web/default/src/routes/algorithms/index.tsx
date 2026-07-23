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
import { createFileRoute } from '@tanstack/react-router'

import { getPublicAlgorithms } from '@/features/algorithm-management/api'
import { CapabilityMarketplace } from '@/features/capability-marketplace'
import { ALGORITHM_MARKETPLACE } from '@/features/capability-marketplace/data'
import type { MarketplaceDefinition } from '@/features/capability-marketplace/types'

function AlgorithmSquare() {
  const query = useQuery({
    queryKey: ['algorithms', 'public'],
    queryFn: getPublicAlgorithms,
    staleTime: 30_000,
  })
  const definition: MarketplaceDefinition = {
    ...ALGORITHM_MARKETPLACE,
    live: true,
    items: (query.data ?? []).map((algorithm) => ({
      id: algorithm.name,
      nameKey: algorithm.display_name,
      descriptionKey: algorithm.description,
      categoryKey: algorithm.category || 'Other',
      icon: 'document',
      status: 'ready',
      version: algorithm.version || 'OpenAPI',
      tags: algorithm.tags,
      inputKey: algorithm.content_type,
      outputKey: 'OpenAPI response',
      deliveryKey: 'Unified algorithm API',
      endpoint: `/v1/algorithms/invoke?algorithm=${algorithm.name}`,
      price: algorithm.price,
    })),
  }
  return <CapabilityMarketplace definition={definition} />
}

export const Route = createFileRoute('/algorithms/')({
  component: AlgorithmSquare,
})
