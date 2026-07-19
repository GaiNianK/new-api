import { useQueryClient } from '@tanstack/react-query'
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
  ArrowDown,
  ArrowUp,
  BookOpen,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ApiDocumentationEntry } from '@/features/docs/types'

import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import {
  ApiDocumentationFormDialog,
  type ApiDocumentationFormValues,
} from './api-documentation-form-dialog'

type ApiDocumentationSectionProps = {
  data: string
}

function createDocumentId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `document-${crypto.randomUUID()}`
  }
  return `document-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function parseDocuments(raw: string): ApiDocumentationEntry[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ApiDocumentationSection(props: ApiDocumentationSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const updateOption = useUpdateOption()
  const [documents, setDocuments] = useState<ApiDocumentationEntry[]>([])
  const [editingDocument, setEditingDocument] =
    useState<ApiDocumentationEntry | null>(null)
  const [deletingDocument, setDeletingDocument] =
    useState<ApiDocumentationEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setDocuments(parseDocuments(props.data))
    setHasChanges(false)
  }, [props.data])

  const publishedCount = useMemo(
    () => documents.filter((document) => document.published).length,
    [documents]
  )

  const openAddDialog = () => {
    setEditingDocument(null)
    setShowForm(true)
  }

  const openEditDialog = (document: ApiDocumentationEntry) => {
    setEditingDocument(document)
    setShowForm(true)
  }

  const submitDocument = (values: ApiDocumentationFormValues) => {
    const nextDocument: ApiDocumentationEntry = {
      id: editingDocument?.id ?? createDocumentId(),
      ...values,
    }

    setDocuments((current) => {
      if (!editingDocument) return [...current, nextDocument]
      return current.map((document) =>
        document.id === editingDocument.id ? nextDocument : document
      )
    })
    setHasChanges(true)
    setShowForm(false)
    setEditingDocument(null)
    toast.success(
      t(
        editingDocument
          ? 'API document updated. Save changes to publish it.'
          : 'API document added. Save changes to publish it.'
      )
    )
  }

  const togglePublished = (id: string, published: boolean) => {
    setDocuments((current) =>
      current.map((document) =>
        document.id === id ? { ...document, published } : document
      )
    )
    setHasChanges(true)
  }

  const moveDocument = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= documents.length) return

    setDocuments((current) => {
      const next = [...current]
      const [document] = next.splice(index, 1)
      next.splice(targetIndex, 0, document)
      return next
    })
    setHasChanges(true)
  }

  const confirmDelete = () => {
    if (!deletingDocument) return
    setDocuments((current) =>
      current.filter((document) => document.id !== deletingDocument.id)
    )
    setHasChanges(true)
    setDeletingDocument(null)
    toast.success(t('API document removed. Save changes to apply.'))
  }

  const saveDocuments = async () => {
    const response = await updateOption.mutateAsync({
      key: 'console_setting.api_documentation',
      value: JSON.stringify(documents),
    })
    if (!response.success) return

    setHasChanges(false)
    await queryClient.invalidateQueries({ queryKey: ['api-documentation'] })
    toast.success(t('API documentation saved successfully'))
  }

  const reservedSlugs = documents
    .filter((document) => document.id !== editingDocument?.id)
    .map((document) => document.slug)

  return (
    <SettingsSection title={t('API Documentation')}>
      <div className='space-y-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-muted-foreground text-sm leading-6'>
              {t(
                'Create and publish the endpoint documentation shown on the public Docs page.'
              )}
            </p>
            <div className='mt-2 flex items-center gap-2'>
              <Badge variant='secondary'>
                {t('{{count}} documents', { count: documents.length })}
              </Badge>
              <Badge variant='outline'>
                {t('{{count}} published', { count: publishedCount })}
              </Badge>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' render={<Link to='/docs' />}>
              <ExternalLink className='mr-2 size-4' />
              {t('View public docs')}
            </Button>
            <Button variant='outline' onClick={openAddDialog}>
              <Plus className='mr-2 size-4' />
              {t('Add API document')}
            </Button>
            <Button
              onClick={saveDocuments}
              disabled={!hasChanges || updateOption.isPending}
            >
              <Save className='mr-2 size-4' />
              {updateOption.isPending ? t('Saving...') : t('Save changes')}
            </Button>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className='border-border/60 flex flex-col items-center rounded-lg border border-dashed px-6 py-14 text-center'>
            <div className='bg-muted flex size-11 items-center justify-center rounded-lg'>
              <BookOpen className='text-muted-foreground size-5' />
            </div>
            <h3 className='mt-4 text-sm font-semibold'>
              {t('No API documents yet')}
            </h3>
            <p className='text-muted-foreground mt-1 max-w-md text-sm leading-6'>
              {t(
                'Add the first document, provide request examples, then publish it when it is ready.'
              )}
            </p>
            <Button className='mt-5' onClick={openAddDialog}>
              <Plus className='mr-2 size-4' />
              {t('Add API document')}
            </Button>
          </div>
        ) : (
          <div className='border-border/60 overflow-hidden rounded-lg border'>
            <div className='bg-muted/30 text-muted-foreground hidden grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_120px_180px] gap-4 border-b px-4 py-2.5 text-xs font-medium lg:grid'>
              <span>{t('Document')}</span>
              <span>{t('Endpoint')}</span>
              <span>{t('Published')}</span>
              <span className='text-right'>{t('Actions')}</span>
            </div>
            {documents.map((document, index) => (
              <div
                key={document.id}
                className='border-border/60 grid gap-4 border-b p-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_120px_180px] lg:items-center'
              >
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='truncate text-sm font-semibold'>
                      {document.title}
                    </span>
                    {document.category && (
                      <Badge variant='secondary' className='text-[10px]'>
                        {document.category}
                      </Badge>
                    )}
                  </div>
                  <p className='text-muted-foreground mt-1 truncate text-xs'>
                    {[document.provider, document.model]
                      .filter(Boolean)
                      .join(' · ') || document.slug}
                  </p>
                </div>
                <div className='flex min-w-0 items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='shrink-0 font-mono text-[10px]'
                  >
                    {document.method}
                  </Badge>
                  <code className='text-muted-foreground truncate font-mono text-xs'>
                    {document.path}
                  </code>
                </div>
                <div className='flex items-center gap-2'>
                  <Switch
                    size='sm'
                    checked={document.published}
                    onCheckedChange={(checked) =>
                      togglePublished(document.id, checked)
                    }
                    aria-label={t('Publish document')}
                  />
                  <span className='text-muted-foreground text-xs'>
                    {document.published ? t('Published') : t('Draft')}
                  </span>
                </div>
                <div className='flex items-center justify-end gap-1'>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          disabled={index === 0}
                          onClick={() => moveDocument(index, -1)}
                          aria-label={t('Move up')}
                        />
                      }
                    >
                      <ArrowUp className='size-4' />
                    </TooltipTrigger>
                    <TooltipContent>{t('Move up')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          disabled={index === documents.length - 1}
                          onClick={() => moveDocument(index, 1)}
                          aria-label={t('Move down')}
                        />
                      }
                    >
                      <ArrowDown className='size-4' />
                    </TooltipTrigger>
                    <TooltipContent>{t('Move down')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          onClick={() => openEditDialog(document)}
                          aria-label={t('Edit')}
                        />
                      }
                    >
                      <Pencil className='size-4' />
                    </TooltipTrigger>
                    <TooltipContent>{t('Edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='text-red-500 hover:text-red-600'
                          onClick={() => setDeletingDocument(document)}
                          aria-label={t('Delete')}
                        />
                      }
                    >
                      <Trash2 className='size-4' />
                    </TooltipTrigger>
                    <TooltipContent>{t('Delete')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApiDocumentationFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        entry={editingDocument}
        reservedSlugs={reservedSlugs}
        onSubmit={submitDocument}
      />

      <AlertDialog
        open={Boolean(deletingDocument)}
        onOpenChange={(open) => {
          if (!open) setDeletingDocument(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete API document?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'The document will be removed after you save the documentation settings.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={confirmDelete}>
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
