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
  Braces,
  ChartNoAxesCombined,
  Gauge,
  Network,
  Route,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()
  const features = [
    {
      id: 'model-governance',
      num: '01',
      title: t('home.enterprise.features.models.title'),
      description: t('home.enterprise.features.models.description'),
      span: 'md:col-span-2',
      icon: <Network className='size-4 text-blue-500' />,
      visual: (
        <div className='mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {['OpenAI API', 'Claude API', 'Gemini API'].map((protocol) => (
            <div
              key={protocol}
              className='border-border/40 bg-muted/20 text-muted-foreground rounded-md border px-3 py-2 text-center text-xs'
            >
              {protocol}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'access-control',
      num: '02',
      title: t('home.enterprise.features.access.title'),
      description: t('home.enterprise.features.access.description'),
      span: 'md:col-span-1',
      icon: <ShieldCheck className='size-4 text-emerald-500' />,
      visual: (
        <div className='mt-5 space-y-2'>
          {[
            t('home.enterprise.features.access.userGroup'),
            t('home.enterprise.features.access.tokenScope'),
            t('home.enterprise.features.access.modelGroup'),
          ].map((label) => (
            <div key={label} className='flex items-center gap-2 text-xs'>
              <span className='size-1.5 rounded-full bg-emerald-500' />
              <span className='text-muted-foreground'>{label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'cost-governance',
      num: '03',
      title: t('home.enterprise.features.cost.title'),
      description: t('home.enterprise.features.cost.description'),
      span: 'md:col-span-1',
      icon: <ChartNoAxesCombined className='size-4 text-amber-500' />,
      visual: (
        <div className='mt-5 space-y-2.5'>
          {[
            t('home.enterprise.features.cost.budget'),
            t('home.enterprise.features.cost.quota'),
            t('home.enterprise.features.cost.billing'),
          ].map((label, index) => (
            <div key={label} className='flex items-center gap-3'>
              <span className='text-muted-foreground w-12 text-[11px]'>
                {label}
              </span>
              <div className='bg-border/50 h-1.5 flex-1 overflow-hidden rounded-full'>
                <div
                  className='h-full rounded-full bg-blue-500/70'
                  style={{ width: `${82 - index * 18}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'audit',
      num: '04',
      title: t('home.enterprise.features.audit.title'),
      description: t('home.enterprise.features.audit.description'),
      span: 'md:col-span-2',
      icon: <ScrollText className='size-4 text-violet-500' />,
      visual: (
        <div className='mt-5 flex flex-wrap gap-2'>
          {[
            t('home.enterprise.features.audit.usage'),
            t('home.enterprise.features.audit.tasks'),
            t('home.enterprise.features.audit.cost'),
          ].map((label) => (
            <span
              key={label}
              className='border-border/40 bg-muted/20 text-muted-foreground rounded-md border px-3 py-2 text-xs'
            >
              {label}
            </span>
          ))}
        </div>
      ),
    },
  ]
  const supportingFeatures = [
    {
      icon: Route,
      title: t('home.enterprise.features.routing.title'),
      description: t('home.enterprise.features.routing.description'),
    },
    {
      icon: UsersRound,
      title: t('home.enterprise.features.team.title'),
      description: t('home.enterprise.features.team.description'),
    },
    {
      icon: Braces,
      title: t('home.enterprise.features.compatibility.title'),
      description: t('home.enterprise.features.compatibility.description'),
    },
    {
      icon: Gauge,
      title: t('home.enterprise.features.operations.title'),
      description: t('home.enterprise.features.operations.description'),
    },
  ]

  return (
    <section className='relative z-10 px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 max-w-2xl md:mb-16'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('home.enterprise.features.eyebrow')}
          </p>
          <h2 className='text-2xl leading-tight font-bold tracking-normal md:text-3xl'>
            {t('home.enterprise.features.heading')}
          </h2>
          <p className='text-muted-foreground mt-4 max-w-xl text-sm leading-6'>
            {t('home.enterprise.features.intro')}
          </p>
        </AnimateInView>

        <div className='border-border/40 bg-border/40 grid gap-px overflow-hidden rounded-lg border md:grid-cols-3'>
          {features.map((feature, index) => (
            <AnimateInView
              key={feature.id}
              delay={index * 80}
              animation='scale-in'
              className={`bg-background hover:bg-muted/20 p-7 transition-colors duration-300 md:p-8 ${feature.span}`}
            >
              <div className='mb-3 flex items-center gap-3'>
                <span className='border-border/40 bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-md border text-[10px] font-semibold tabular-nums'>
                  {feature.num}
                </span>
                {feature.icon}
                <h3 className='text-sm font-semibold'>{feature.title}</h3>
              </div>
              <p className='text-muted-foreground text-sm leading-6'>
                {feature.description}
              </p>
              {feature.visual}
            </AnimateInView>
          ))}
        </div>

        <div className='border-border/40 mt-10 grid border-y sm:grid-cols-2 lg:grid-cols-4'>
          {supportingFeatures.map((feature, index) => (
            <AnimateInView
              key={feature.title}
              delay={index * 80}
              animation='fade-up'
              className='border-border/40 flex gap-3 py-6 sm:border-l sm:px-6 sm:first:border-l-0 lg:first:pl-0'
            >
              <feature.icon className='mt-0.5 size-5 shrink-0 text-blue-500' />
              <div>
                <h3 className='text-sm font-semibold'>{feature.title}</h3>
                <p className='text-muted-foreground mt-1.5 text-xs leading-5'>
                  {feature.description}
                </p>
              </div>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
