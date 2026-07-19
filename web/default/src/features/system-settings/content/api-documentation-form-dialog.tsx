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
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  API_DOCUMENTATION_LANGUAGES,
  API_DOCUMENTATION_METHODS,
  type ApiDocumentationEntry,
} from '@/features/docs/types'

const parameterSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Parameter name is required').max(100),
  type: z.string().trim().min(1, 'Parameter type is required').max(100),
  required: z.boolean(),
  default_value: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
})

const apiDocumentationSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100)
    .regex(
      /^[a-z0-9][a-z0-9_-]*$/,
      'Use lowercase letters, numbers, hyphens, or underscores'
    ),
  title: z.string().trim().min(1, 'Title is required').max(200),
  category: z.string().max(100).optional(),
  provider: z.string().max(100).optional(),
  model: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  base_url: z.string().url().optional().or(z.literal('')),
  method: z.enum(API_DOCUMENTATION_METHODS),
  path: z
    .string()
    .trim()
    .min(1, 'Endpoint path is required')
    .max(500)
    .startsWith('/', 'Endpoint path must start with /'),
  authentication: z.string().max(5000).optional(),
  published: z.boolean(),
  code_samples: z.object({
    curl: z.string().max(20000),
    python: z.string().max(20000),
    typescript: z.string().max(20000),
    javascript: z.string().max(20000),
  }),
  parameters: z.array(parameterSchema).max(100),
  response_example: z.string().max(20000).optional(),
  notes: z.string().max(5000).optional(),
})

export type ApiDocumentationFormValues = z.infer<typeof apiDocumentationSchema>

type ApiDocumentationFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: ApiDocumentationEntry | null
  reservedSlugs: string[]
  onSubmit: (values: ApiDocumentationFormValues) => void
}

const API_DOCUMENTATION_FORM_ID = 'api-documentation-form'
const CODE_SAMPLE_LABELS = {
  curl: 'cURL',
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
} as const

function createLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function toFormValues(
  entry: ApiDocumentationEntry | null
): ApiDocumentationFormValues {
  return {
    slug: entry?.slug ?? '',
    title: entry?.title ?? '',
    category: entry?.category ?? '',
    provider: entry?.provider ?? '',
    model: entry?.model ?? '',
    description: entry?.description ?? '',
    base_url: entry?.base_url ?? '',
    method: entry?.method ?? 'POST',
    path: entry?.path ?? '/v1/chat/completions',
    authentication: entry?.authentication ?? '',
    published: entry?.published ?? false,
    code_samples: {
      curl: entry?.code_samples?.curl ?? '',
      python: entry?.code_samples?.python ?? '',
      typescript: entry?.code_samples?.typescript ?? '',
      javascript: entry?.code_samples?.javascript ?? '',
    },
    parameters: entry?.parameters ?? [],
    response_example: entry?.response_example ?? '',
    notes: entry?.notes ?? '',
  }
}

export function ApiDocumentationFormDialog(
  props: ApiDocumentationFormDialogProps
) {
  const { t } = useTranslation()
  const form = useForm<ApiDocumentationFormValues>({
    resolver: zodResolver(apiDocumentationSchema),
    defaultValues: toFormValues(props.entry),
  })
  const parameters = useFieldArray({
    control: form.control,
    name: 'parameters',
  })

  useEffect(() => {
    form.reset(toFormValues(props.entry))
  }, [form, props.entry, props.open])

  const submitForm = (values: ApiDocumentationFormValues) => {
    if (props.reservedSlugs.includes(values.slug)) {
      form.setError('slug', { message: t('This slug is already in use') })
      return
    }
    props.onSubmit(values)
  }

  const generateSamples = () => {
    const baseUrl = form.getValues('base_url') || 'https://api.example.com'
    const method = form.getValues('method')
    const path = form.getValues('path') || '/v1/chat/completions'
    const model = form.getValues('model') || 'your-model'
    const requestBody = JSON.stringify(
      {
        model,
        messages: [{ role: 'user', content: 'Hello' }],
      },
      null,
      2
    )

    form.setValue(
      'code_samples.curl',
      [
        `curl -X ${method} ${baseUrl}${path} \\`,
        '  -H "Authorization: Bearer $API_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        `  -d '${requestBody.replaceAll('\n', '\n     ')}'`,
      ].join('\n'),
      { shouldDirty: true }
    )
    form.setValue(
      'code_samples.python',
      [
        'import requests',
        '',
        `response = requests.${method.toLowerCase()}(`,
        `    "${baseUrl}${path}",`,
        '    headers={"Authorization": "Bearer <YOUR_API_KEY>"},',
        `    json=${JSON.stringify({ model, messages: [{ role: 'user', content: 'Hello' }] })},`,
        ')',
        'print(response.json())',
      ].join('\n'),
      { shouldDirty: true }
    )
    const fetchSample = [
      `const response = await fetch('${baseUrl}${path}', {`,
      `  method: '${method}',`,
      '  headers: {',
      "    Authorization: 'Bearer <YOUR_API_KEY>',",
      "    'Content-Type': 'application/json',",
      '  },',
      `  body: JSON.stringify(${JSON.stringify({ model, messages: [{ role: 'user', content: 'Hello' }] })}),`,
      '})',
      '',
      'console.log(await response.json())',
    ].join('\n')
    form.setValue('code_samples.typescript', fetchSample, {
      shouldDirty: true,
    })
    form.setValue('code_samples.javascript', fetchSample, {
      shouldDirty: true,
    })
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.entry ? t('Edit API document') : t('Add API document')}
      description={t(
        'Configure the public endpoint, examples, parameters, and publication status.'
      )}
      contentClassName='sm:max-w-5xl'
      contentHeight='min(72vh, 760px)'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type='submit' form={API_DOCUMENTATION_FORM_ID}>
            {props.entry ? t('Update document') : t('Add document')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={API_DOCUMENTATION_FORM_ID}
          onSubmit={form.handleSubmit(submitForm)}
        >
          <Tabs defaultValue='general'>
            <TabsList className='mb-5 w-full justify-start overflow-x-auto'>
              <TabsTrigger value='general'>
                {t('Basic information')}
              </TabsTrigger>
              <TabsTrigger value='samples'>{t('Code samples')}</TabsTrigger>
              <TabsTrigger value='parameters'>{t('Parameters')}</TabsTrigger>
              <TabsTrigger value='response'>
                {t('Response and notes')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='general' className='space-y-5'>
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Document title')}</FormLabel>
                      <FormControl>
                        <Input placeholder='Chat Completions' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Slug')}</FormLabel>
                      <FormControl>
                        <Input placeholder='chat-completions' {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('Unique identifier used for links and selection.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Category')}</FormLabel>
                      <FormControl>
                        <Input placeholder='Text generation' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='provider'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Provider')}</FormLabel>
                      <FormControl>
                        <Input placeholder='OpenAI compatible' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='model'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Model name')}</FormLabel>
                      <FormControl>
                        <Input placeholder='gpt-4.1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='base_url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Base URL')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://api.example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('Leave blank to use the current website address.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='method'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('HTTP method')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={API_DOCUMENTATION_METHODS.map((method) => ({
                          value: method,
                          label: method,
                        }))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {API_DOCUMENTATION_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='path'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Endpoint path')}</FormLabel>
                      <FormControl>
                        <Input placeholder='/v1/chat/completions' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='authentication'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Authentication instructions')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder='Authorization: Bearer <TOKEN>'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='published'
                render={({ field }) => (
                  <FormItem className='border-border/60 flex items-center justify-between rounded-lg border px-4 py-3'>
                    <div>
                      <FormLabel>{t('Publish document')}</FormLabel>
                      <FormDescription>
                        {t(
                          'Only published documents appear on the public page.'
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value='samples' className='space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <p className='text-muted-foreground text-sm'>
                  {t('Add only the languages you want to expose publicly.')}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  onClick={generateSamples}
                >
                  <Sparkles className='mr-2 size-4' />
                  {t('Generate editable templates')}
                </Button>
              </div>
              <Tabs defaultValue='curl'>
                <TabsList className='w-full justify-start overflow-x-auto'>
                  {API_DOCUMENTATION_LANGUAGES.map((language) => (
                    <TabsTrigger key={language} value={language}>
                      {CODE_SAMPLE_LABELS[language]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {API_DOCUMENTATION_LANGUAGES.map((language) => (
                  <TabsContent key={language} value={language} className='pt-3'>
                    <FormField
                      control={form.control}
                      name={`code_samples.${language}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Code sample')}</FormLabel>
                          <FormControl>
                            <Textarea
                              className='min-h-80 font-mono text-xs'
                              spellCheck={false}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            <TabsContent value='parameters' className='space-y-4'>
              <div className='flex items-center justify-between gap-3'>
                <p className='text-muted-foreground text-sm'>
                  {t(
                    'Describe request parameters in the order users should read them.'
                  )}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    parameters.append({
                      id: createLocalId('parameter'),
                      name: '',
                      type: 'string',
                      required: false,
                      default_value: '',
                      description: '',
                    })
                  }
                >
                  <Plus className='mr-2 size-4' />
                  {t('Add parameter')}
                </Button>
              </div>
              {parameters.fields.length === 0 ? (
                <div className='border-border/60 text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm'>
                  {t('No parameters have been added.')}
                </div>
              ) : (
                <div className='space-y-3'>
                  {parameters.fields.map((parameter, index) => (
                    <div
                      key={parameter.id}
                      className='border-border/60 rounded-lg border p-4'
                    >
                      <div className='grid gap-3 md:grid-cols-[1fr_0.75fr_1fr_auto]'>
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Name')}</FormLabel>
                              <FormControl>
                                <Input placeholder='temperature' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Type')}</FormLabel>
                              <FormControl>
                                <Input placeholder='number' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.default_value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Default value')}</FormLabel>
                              <FormControl>
                                <Input placeholder='1' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='self-end text-red-500'
                          aria-label={t('Delete parameter')}
                          title={t('Delete parameter')}
                          onClick={() => parameters.remove(index)}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                      <div className='mt-3 grid gap-3 md:grid-cols-[auto_1fr] md:items-start'>
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.required`}
                          render={({ field }) => (
                            <FormItem className='flex items-center gap-2 pt-2'>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className='m-0'>
                                {t('Required')}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Description')}</FormLabel>
                              <FormControl>
                                <Textarea rows={2} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='response' className='space-y-5'>
              <FormField
                control={form.control}
                name='response_example'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Response example')}</FormLabel>
                    <FormControl>
                      <Textarea
                        className='min-h-72 font-mono text-xs'
                        spellCheck={false}
                        placeholder='{ "id": "..." }'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Additional notes')}</FormLabel>
                    <FormControl>
                      <Textarea rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </Dialog>
  )
}
