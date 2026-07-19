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
import { ChartNoAxesCombined, Network, Route, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface StatsProps {
  className?: string
}

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()
  const capabilities = [
    {
      icon: Network,
      title: t('home.enterprise.capabilities.access.title'),
      description: t('home.enterprise.capabilities.access.description'),
    },
    {
      icon: ShieldCheck,
      title: t('home.enterprise.capabilities.permissions.title'),
      description: t('home.enterprise.capabilities.permissions.description'),
    },
    {
      icon: ChartNoAxesCombined,
      title: t('home.enterprise.capabilities.cost.title'),
      description: t('home.enterprise.capabilities.cost.description'),
    },
    {
      icon: Route,
      title: t('home.enterprise.capabilities.routing.title'),
      description: t('home.enterprise.capabilities.routing.description'),
    },
  ]

  return (
    <section className='relative z-10 px-6 py-8'>
      <div className='border-border/40 bg-border/40 mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4'>
        {capabilities.map((capability) => (
          <div
            key={capability.title}
            className='bg-background flex gap-4 px-6 py-7'
          >
            <capability.icon className='mt-0.5 size-5 shrink-0 text-blue-500' />
            <div>
              <h2 className='text-sm font-semibold'>{capability.title}</h2>
              <p className='text-muted-foreground mt-1.5 text-xs leading-5'>
                {capability.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
