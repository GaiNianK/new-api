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
import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  if (props.isAuthenticated) {
    return null
  }

  return (
    <section className='relative z-10 px-6 py-20 md:py-24'>
      <AnimateInView
        className='mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center'
        animation='fade-up'
      >
        <div className='max-w-2xl'>
          <div className='text-muted-foreground mb-4 flex items-center gap-2 text-xs font-medium'>
            <Building2 className='size-4 text-blue-500' />
            {t('home.enterprise.cta.eyebrow')}
          </div>
          <h2 className='text-2xl leading-tight font-bold tracking-normal md:text-3xl'>
            {t('home.enterprise.cta.heading')}
          </h2>
          <p className='text-muted-foreground mt-4 max-w-xl text-sm leading-6'>
            {t('home.enterprise.cta.description')}
          </p>
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-3'>
          <Button
            className='group h-11 rounded-md px-5'
            render={<Link to='/sign-up' />}
          >
            {t('home.enterprise.cta.primary')}
            <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
          </Button>
          <Button
            variant='outline'
            className='border-border/60 hover:border-border hover:bg-muted/50 h-11 rounded-md px-5'
            render={<Link to='/pricing' />}
          >
            {t('home.enterprise.cta.pricing')}
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
