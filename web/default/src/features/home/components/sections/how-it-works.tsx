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
import { ChartNoAxesCombined, Network, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    {
      num: '1',
      title: t('home.enterprise.workflow.connect.title'),
      description: t('home.enterprise.workflow.connect.description'),
      icon: Network,
    },
    {
      num: '2',
      title: t('home.enterprise.workflow.control.title'),
      description: t('home.enterprise.workflow.control.description'),
      icon: ShieldCheck,
    },
    {
      num: '3',
      title: t('home.enterprise.workflow.govern.title'),
      description: t('home.enterprise.workflow.govern.description'),
      icon: ChartNoAxesCombined,
    },
  ]

  return (
    <section className='relative z-10 px-6 py-20 md:py-24'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 md:mb-16'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('home.enterprise.workflow.eyebrow')}
          </p>
          <h2 className='max-w-2xl text-2xl font-bold tracking-normal md:text-3xl'>
            {t('home.enterprise.workflow.heading')}
          </h2>
        </AnimateInView>

        <div className='border-border/40 bg-border/40 grid gap-px overflow-hidden rounded-lg border md:grid-cols-3'>
          {steps.map((step, index) => (
            <AnimateInView
              key={step.num}
              delay={index * 120}
              animation='fade-up'
              className='bg-background relative flex gap-5 p-7 md:p-8'
            >
              <div className='border-border/50 bg-muted/30 flex size-11 shrink-0 items-center justify-center rounded-md border'>
                <step.icon className='size-5 text-blue-500' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-semibold tabular-nums'>
                  {step.num.padStart(2, '0')}
                </p>
                <h3 className='mt-1 text-base font-semibold'>{step.title}</h3>
                <p className='text-muted-foreground mt-2 max-w-[260px] text-sm leading-6'>
                  {step.description}
                </p>
              </div>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
