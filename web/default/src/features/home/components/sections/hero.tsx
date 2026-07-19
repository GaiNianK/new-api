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
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { resolveDocumentationLink } from '@/lib/documentation-link'

import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsLink = resolveDocumentationLink(
    status?.docs_link as string | undefined
  )
  const enterpriseSignals = [
    {
      icon: ShieldCheck,
      title: t('home.enterprise.hero.signals.access.title'),
      description: t('home.enterprise.hero.signals.access.description'),
    },
    {
      icon: ChartNoAxesCombined,
      title: t('home.enterprise.hero.signals.cost.title'),
      description: t('home.enterprise.hero.signals.cost.description'),
    },
    {
      icon: Route,
      title: t('home.enterprise.hero.signals.routing.title'),
      description: t('home.enterprise.hero.signals.routing.description'),
    },
  ]

  const renderDocsButton = () => {
    const content = (
      <>
        <BookOpen className='size-4' />
        <span>{t('Docs')}</span>
      </>
    )
    const className =
      'border-border/60 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-medium'

    if (docsLink.external) {
      return (
        <Button
          variant='outline'
          className={className}
          render={
            <a href={docsLink.href} target='_blank' rel='noopener noreferrer' />
          }
        >
          {content}
        </Button>
      )
    }

    return (
      <Button
        variant='outline'
        className={className}
        render={<Link to={docsLink.href} />}
      >
        {content}
      </Button>
    )
  }

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-20 pb-14 md:pt-28 md:pb-20 lg:pt-32'>
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] bg-[size:4rem_4rem] opacity-[0.06]'
      />

      <div className='mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10'>
        <div className='flex flex-col items-start text-left lg:col-span-6'>
          <div
            className='landing-animate-fade-up border-border/60 bg-muted/30 text-muted-foreground mb-5 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium opacity-0'
            style={{ animationDelay: '0ms' }}
          >
            <Building2 className='size-3.5 text-blue-500' />
            <span>{t('home.enterprise.hero.badge')}</span>
          </div>

          <h1
            className='landing-animate-fade-up max-w-2xl text-4xl leading-[1.15] font-bold tracking-normal opacity-0 md:text-5xl'
            style={{ animationDelay: '60ms' }}
          >
            {t('home.enterprise.hero.title')}
          </h1>
          <p
            className='landing-animate-fade-up text-muted-foreground mt-6 max-w-xl text-base leading-7 opacity-0'
            style={{ animationDelay: '120ms' }}
          >
            {t('home.enterprise.hero.description')}
          </p>

          <div
            className='landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3 opacity-0'
            style={{ animationDelay: '180ms' }}
          >
            <Button
              className='group h-11 rounded-md px-5 text-sm font-medium'
              render={
                <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
              }
            >
              {t(
                props.isAuthenticated
                  ? 'home.enterprise.hero.dashboard'
                  : 'home.enterprise.hero.start'
              )}
              <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
            </Button>
            <Button
              variant='outline'
              className='border-border/60 hover:border-border hover:bg-muted/50 h-11 rounded-md px-5 text-sm font-medium'
              render={<Link to='/pricing' />}
            >
              {t('home.enterprise.hero.pricing')}
            </Button>
            {renderDocsButton()}
          </div>

          <div
            className='landing-animate-fade-up border-border/50 mt-10 grid w-full max-w-xl border-y opacity-0 sm:grid-cols-3'
            style={{ animationDelay: '240ms' }}
          >
            {enterpriseSignals.map((signal) => (
              <div
                key={signal.title}
                className='border-border/50 flex gap-3 py-4 sm:border-l sm:px-4 sm:first:border-l-0 sm:first:pl-0'
              >
                <signal.icon className='mt-0.5 size-4 shrink-0 text-blue-500' />
                <div>
                  <p className='text-xs font-semibold'>{signal.title}</p>
                  <p className='text-muted-foreground mt-1 text-xs leading-5'>
                    {signal.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className='landing-animate-fade-up flex w-full justify-center opacity-0 lg:col-span-6'
          style={{ animationDelay: '300ms' }}
        >
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}
