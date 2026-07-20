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

interface StatsProps {
  className?: string
}

const capabilities = [
  [
    'Multi-node unified management',
    'Centrally manage distributed model services',
  ],
  [
    'Multi-protocol compatible access',
    'Reduce application changes through a unified API',
  ],
  [
    'Full-link monitoring and analysis',
    'Understand operations from gateway to inference engine',
  ],
  ['Request-path audit', 'Support troubleshooting and internal governance'],
] as const

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()

  return (
    <section className='border-border/60 bg-background border-b'>
      <div className='mx-auto max-w-6xl'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
          {capabilities.map(([title, description]) => (
            <div
              key={title}
              className='border-border/60 border-b px-6 py-7 last:border-b-0 lg:border-b-0 lg:last:border-r-0 lg:[&:nth-child(even)]:border-r sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0'
            >
              <h2 className='text-sm font-semibold'>{t(title)}</h2>
              <p className='text-muted-foreground mt-2 text-sm leading-6'>
                {t(description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
