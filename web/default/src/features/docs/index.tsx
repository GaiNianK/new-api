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
  Braces,
  CircleAlert,
  FileText,
  KeyRound,
  Loader2,
  Search,
  Server,
  SquareTerminal,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BundledLanguage } from 'shiki/bundle/web'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStatus } from '@/hooks/use-status'
import { cn } from '@/lib/utils'

import type { ApiDocumentationEntry, ApiDocumentationLanguage } from './types'
import { useApiDocumentation } from './use-api-documentation'

const LANGUAGE_LABELS: Record<ApiDocumentationLanguage, string> = {
  curl: 'cURL',
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
}

const LANGUAGE_HIGHLIGHT: Record<ApiDocumentationLanguage, BundledLanguage> = {
  curl: 'bash',
  python: 'python',
  typescript: 'typescript',
  javascript: 'javascript',
}

function resolveSiteBaseUrl(status: Record<string, unknown> | null): string {
  const data = status?.data as Record<string, unknown> | undefined
  const candidate =
    status?.server_address ??
    status?.serverAddress ??
    data?.server_address ??
    data?.serverAddress

  if (typeof candidate === 'string' && candidate) {
    return candidate.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://api.example.com'
}

function methodBadgeClass(method: string): string {
  if (method === 'GET') {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  }
  if (method === 'DELETE') {
    return 'bg-red-500/10 text-red-600 dark:text-red-400'
  }
  if (method === 'PUT' || method === 'PATCH') {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  }
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
}

function DocumentationDetails(props: {
  document: ApiDocumentationEntry
  siteBaseUrl: string
}) {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<ApiDocumentationLanguage>('curl')
  const availableLanguages = useMemo(
    () =>
      (Object.keys(LANGUAGE_LABELS) as ApiDocumentationLanguage[]).filter(
        (item) => Boolean(props.document.code_samples?.[item]?.trim())
      ),
    [props.document]
  )
  const activeLanguage = availableLanguages.includes(language)
    ? language
    : availableLanguages[0]
  const baseUrl = (props.document.base_url || props.siteBaseUrl).replace(
    /\/$/,
    ''
  )
  const endpointPath = props.document.model
    ? props.document.path.replaceAll('{model}', props.document.model)
    : props.document.path

  return (
    <main className='min-w-0'>
      <section className='border-border/50 overflow-hidden rounded-lg border'>
        <div className='p-5 sm:p-7'>
          <div className='flex flex-wrap items-center gap-2'>
            {props.document.category && (
              <Badge variant='outline' className='font-mono text-[10px]'>
                {props.document.category}
              </Badge>
            )}
            {props.document.provider && (
              <Badge variant='secondary'>{props.document.provider}</Badge>
            )}
          </div>
          <h2 className='mt-4 text-2xl font-bold tracking-normal break-words md:text-3xl'>
            {props.document.title}
          </h2>
          {props.document.model && (
            <code className='text-muted-foreground mt-2 block font-mono text-xs'>
              {props.document.model}
            </code>
          )}
          {props.document.description && (
            <p className='text-muted-foreground mt-3 max-w-3xl text-sm leading-6 whitespace-pre-wrap'>
              {props.document.description}
            </p>
          )}
        </div>

        <div className='border-border/50 grid border-t md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'>
          <div className='border-border/50 p-5 sm:p-6 md:border-r'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <Server className='size-3.5' />
              {t('docs.baseUrl')}
            </div>
            <code className='bg-muted/60 mt-3 block overflow-x-auto rounded-md px-3 py-2.5 font-mono text-xs'>
              {baseUrl}
            </code>
          </div>
          <div className='p-5 sm:p-6'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <SquareTerminal className='size-3.5' />
              {t('Endpoint')}
            </div>
            <div className='mt-3 flex min-w-0 items-center gap-2 text-xs'>
              <Badge
                className={cn(
                  'h-6 shrink-0 px-2 font-mono text-[10px]',
                  methodBadgeClass(props.document.method)
                )}
              >
                {props.document.method}
              </Badge>
              <code className='text-muted-foreground min-w-0 overflow-x-auto font-mono'>
                {endpointPath}
              </code>
            </div>
          </div>
        </div>
      </section>

      {availableLanguages.length > 0 && activeLanguage && (
        <section className='border-border/50 mt-6 rounded-lg border p-5 sm:p-7'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h3 className='flex items-center gap-2 text-sm font-semibold'>
                <FileText className='size-4 text-blue-500' />
                {t('Code samples')}
              </h3>
              <p className='text-muted-foreground mt-1 text-xs'>
                {t(
                  'Copy an administrator-provided example and replace the API token.'
                )}
              </p>
            </div>
            <Tabs
              value={activeLanguage}
              onValueChange={(value) =>
                setLanguage(value as ApiDocumentationLanguage)
              }
            >
              <TabsList className='max-w-full overflow-x-auto'>
                {availableLanguages.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {LANGUAGE_LABELS[item]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <CodeBlock
            code={props.document.code_samples?.[activeLanguage] ?? ''}
            language={LANGUAGE_HIGHLIGHT[activeLanguage]}
            maxExpandedLines={28}
          >
            <CodeBlockCopyButton />
          </CodeBlock>
        </section>
      )}

      {props.document.authentication && (
        <section className='border-border/50 mt-6 rounded-lg border p-5 sm:p-7'>
          <h3 className='flex items-center gap-2 text-sm font-semibold'>
            <KeyRound className='size-4 text-blue-500' />
            {t('Authentication')}
          </h3>
          <p className='text-muted-foreground mt-3 text-sm leading-6 whitespace-pre-wrap'>
            {props.document.authentication}
          </p>
        </section>
      )}

      {Boolean(props.document.parameters?.length) && (
        <section className='border-border/50 mt-6 rounded-lg border p-5 sm:p-7'>
          <h3 className='flex items-center gap-2 text-sm font-semibold'>
            <Braces className='size-4 text-blue-500' />
            {t('Parameters')}
          </h3>
          <div className='border-border/50 mt-4 overflow-x-auto rounded-lg border'>
            <table className='w-full min-w-[680px] text-left text-xs'>
              <thead className='bg-muted/40 text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>{t('Name')}</th>
                  <th className='px-4 py-3 font-medium'>{t('Type')}</th>
                  <th className='px-4 py-3 font-medium'>{t('Required')}</th>
                  <th className='px-4 py-3 font-medium'>
                    {t('Default value')}
                  </th>
                  <th className='px-4 py-3 font-medium'>{t('Description')}</th>
                </tr>
              </thead>
              <tbody>
                {props.document.parameters?.map((parameter) => (
                  <tr key={parameter.id} className='border-border/50 border-t'>
                    <td className='px-4 py-3'>
                      <code className='font-mono'>{parameter.name}</code>
                    </td>
                    <td className='text-muted-foreground px-4 py-3'>
                      {parameter.type}
                    </td>
                    <td className='px-4 py-3'>
                      {parameter.required ? t('Yes') : t('No')}
                    </td>
                    <td className='text-muted-foreground px-4 py-3'>
                      {parameter.default_value || '—'}
                    </td>
                    <td className='text-muted-foreground px-4 py-3 leading-5'>
                      {parameter.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {props.document.response_example && (
        <section className='border-border/50 mt-6 rounded-lg border p-5 sm:p-7'>
          <h3 className='text-sm font-semibold'>{t('Response example')}</h3>
          <CodeBlock
            code={props.document.response_example}
            language='json'
            maxExpandedLines={24}
          >
            <CodeBlockCopyButton />
          </CodeBlock>
        </section>
      )}

      {props.document.notes && (
        <section className='border-border/50 mt-6 rounded-lg border p-5 sm:p-7'>
          <h3 className='text-sm font-semibold'>{t('Additional notes')}</h3>
          <p className='text-muted-foreground mt-3 text-sm leading-6 whitespace-pre-wrap'>
            {props.document.notes}
          </p>
        </section>
      )}
    </main>
  )
}

export function ApiDocs() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const documentation = useApiDocumentation()
  const [documentQuery, setDocumentQuery] = useState('')
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  )
  const documents = useMemo(
    () => documentation.data?.data ?? [],
    [documentation.data?.data]
  )
  const siteBaseUrl = useMemo(
    () => resolveSiteBaseUrl(status as Record<string, unknown> | null),
    [status]
  )
  const filteredDocuments = useMemo(() => {
    const query = documentQuery.trim().toLowerCase()
    if (!query) return documents
    return documents.filter((document) =>
      [
        document.title,
        document.category,
        document.provider,
        document.model,
        document.description,
        document.path,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [documentQuery, documents])
  const selectedDocument =
    filteredDocuments.find((document) => document.id === selectedDocumentId) ??
    filteredDocuments[0] ??
    documents.find((document) => document.id === selectedDocumentId) ??
    documents[0] ??
    null

  if (documentation.isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='flex min-h-[calc(100dvh-4rem)] items-center justify-center'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Loader2 className='size-4 animate-spin' />
            {t('docs.loading')}
          </div>
        </main>
      </PublicLayout>
    )
  }

  if (documentation.error || documents.length === 0 || !selectedDocument) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6'>
          <div className='max-w-md text-center'>
            <CircleAlert className='text-muted-foreground mx-auto size-8' />
            <h1 className='mt-4 text-xl font-semibold'>
              {t('No published API documentation yet')}
            </h1>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              {t(
                'An administrator can create and publish documentation from System Settings.'
              )}
            </p>
            {documentation.error && (
              <Button
                className='mt-5'
                variant='outline'
                onClick={() => documentation.refetch()}
              >
                {t('docs.retry')}
              </Button>
            )}
          </div>
        </main>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className='mx-auto w-full max-w-[1440px] px-4 pt-20 pb-12 sm:px-6 lg:px-8'>
        <header className='border-border/50 flex flex-col gap-5 border-b pb-7 md:flex-row md:items-end md:justify-between'>
          <div className='max-w-3xl'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <BookOpen className='size-4 text-blue-500' />
              {t('docs.eyebrow')}
            </div>
            <h1 className='mt-3 text-3xl leading-tight font-bold tracking-normal md:text-4xl'>
              {t('docs.title')}
            </h1>
            <p className='text-muted-foreground mt-3 max-w-2xl text-sm leading-6'>
              {t(
                'Browse administrator-published endpoints, authentication instructions, parameters, and code samples.'
              )}
            </p>
          </div>
          <Button
            variant='outline'
            className='group shrink-0'
            render={<Link to='/pricing' />}
          >
            {t('docs.viewModels')}
            <ArrowRight className='ml-1.5 size-4 transition-transform group-hover:translate-x-0.5' />
          </Button>
        </header>

        <div className='mt-7 lg:hidden'>
          <Select
            value={selectedDocument.id}
            onValueChange={setSelectedDocumentId}
            items={documents.map((document) => ({
              value: document.id,
              label: document.title,
            }))}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t('Select API document')} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {documents.map((document) => (
                  <SelectItem key={document.id} value={document.id}>
                    {document.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='mt-7 grid min-w-0 gap-7 lg:grid-cols-[280px_minmax(0,1fr)]'>
          <aside className='hidden lg:block'>
            <div className='border-border/50 sticky top-20 overflow-hidden rounded-lg border'>
              <div className='border-border/50 border-b p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h2 className='text-sm font-semibold'>
                    {t('Documentation')}
                  </h2>
                  <Badge variant='secondary' className='font-mono text-[10px]'>
                    {documents.length}
                  </Badge>
                </div>
                <div className='relative mt-3'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                  <Input
                    value={documentQuery}
                    onChange={(event) => setDocumentQuery(event.target.value)}
                    placeholder={t('Search documentation')}
                    className='pl-9'
                  />
                </div>
              </div>
              <nav className='hover-scrollbar max-h-[calc(100dvh-230px)] overflow-y-auto p-2'>
                {filteredDocuments.length === 0 ? (
                  <p className='text-muted-foreground px-3 py-8 text-center text-xs'>
                    {t('No matching documentation')}
                  </p>
                ) : (
                  filteredDocuments.map((document) => {
                    const isActive = document.id === selectedDocument.id
                    return (
                      <button
                        key={document.id}
                        type='button'
                        onClick={() => setSelectedDocumentId(document.id)}
                        className={cn(
                          'flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors',
                          isActive
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        <FileText className='mt-0.5 size-3.5 shrink-0' />
                        <span className='min-w-0'>
                          <span className='block truncate text-sm font-medium'>
                            {document.title}
                          </span>
                          <span className='mt-0.5 block truncate font-mono text-[11px] opacity-70'>
                            {document.method} {document.path}
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </nav>
            </div>
          </aside>

          <DocumentationDetails
            key={selectedDocument.id}
            document={selectedDocument}
            siteBaseUrl={siteBaseUrl}
          />
        </div>
      </PageTransition>
    </PublicLayout>
  )
}
