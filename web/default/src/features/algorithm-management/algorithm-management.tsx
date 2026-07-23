/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Braces,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  TestTube2,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'
import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  formatDisplayPriceFromUSD,
  formatUSDPriceFromDisplay,
} from '@/features/system-settings/models/pricing-format'
import { useSystemConfigStore } from '@/stores/system-config-store'

import {
  createAlgorithm,
  deleteAlgorithm,
  getAlgorithms,
  importOpenAPI,
  testAlgorithm,
  updateAlgorithm,
  type Algorithm,
  type AlgorithmInput,
  type OpenAPIImport,
} from './api'

type SchemaProperty = {
  type?: string
  format?: string
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  items?: SchemaProperty
  anyOf?: SchemaProperty[]
}

type RequestSchema = {
  properties?: Record<string, SchemaProperty>
  required?: string[]
}

const emptyForm: AlgorithmInput = {
  name: '',
  display_name: '',
  description: '',
  category: '',
  tags: [],
  icon: 'document',
  version: '',
  enabled: true,
  openapi_url: '',
  base_url: '',
  operation_id: '',
  method: 'POST',
  path: '',
  content_type: 'application/json',
  timeout_seconds: 300,
  price: 0,
}

function useAlgorithmPricingCurrency() {
  const currency = useSystemConfigStore((state) => state.config.currency)
  return useMemo(() => {
    if (currency.quotaDisplayType === 'CNY') {
      return {
        symbol: '¥',
        label: 'CNY',
        exchangeRate:
          currency.usdExchangeRate > 0 ? currency.usdExchangeRate : 1,
      }
    }
    if (currency.quotaDisplayType === 'CUSTOM') {
      return {
        symbol: currency.customCurrencySymbol || '¤',
        label: currency.customCurrencySymbol || 'Custom',
        exchangeRate:
          currency.customCurrencyExchangeRate > 0
            ? currency.customCurrencyExchangeRate
            : 1,
      }
    }
    return { symbol: '$', label: 'USD', exchangeRate: 1 }
  }, [currency])
}

function Field(props: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={props.className ?? 'space-y-2'}>
      <Label>{props.label}</Label>
      {props.children}
    </div>
  )
}

function AlgorithmDialog(props: {
  open: boolean
  algorithm: Algorithm | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const pricingCurrency = useAlgorithmPricingCurrency()
  const [form, setForm] = useState<AlgorithmInput>(emptyForm)
  const [spec, setSpec] = useState<OpenAPIImport | null>(null)
  const [tagText, setTagText] = useState('')

  useEffect(() => {
    if (!props.open) return
    if (props.algorithm) {
      let requestSchema: Record<string, unknown> | undefined
      if (props.algorithm.request_schema) {
        try {
          requestSchema = JSON.parse(props.algorithm.request_schema) as Record<
            string,
            unknown
          >
        } catch {
          requestSchema = undefined
        }
      }
      setForm({
        ...props.algorithm,
        price: Number(
          formatDisplayPriceFromUSD(
            props.algorithm.price,
            pricingCurrency.exchangeRate
          )
        ),
        request_schema: requestSchema,
      })
      setTagText(props.algorithm.tags.join(', '))
    } else {
      setForm(emptyForm)
      setTagText('')
    }
    setSpec(null)
  }, [pricingCurrency.exchangeRate, props.algorithm, props.open])

  const importMutation = useMutation({
    mutationFn: () => importOpenAPI(form.openapi_url),
    onSuccess: (data) => {
      setSpec(data)
      setForm((current) => ({
        ...current,
        base_url: data.base_url,
        display_name: current.display_name || data.title,
        version: current.version || data.version,
      }))
    },
    onError: (error) => toast.error(error.message),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        ...form,
        price: Number(
          formatUSDPriceFromDisplay(form.price, pricingCurrency.exchangeRate)
        ),
        tags: tagText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }
      return props.algorithm
        ? updateAlgorithm(props.algorithm.id, input)
        : createAlgorithm(input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['algorithms'] })
      toast.success(t('Algorithm service saved'))
      props.onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const selectOperation = (index: number) => {
    const operation = spec?.operations[index]
    if (!operation) return
    setForm((current) => ({
      ...current,
      operation_id: operation.operation_id,
      method: operation.method,
      path: operation.path,
      content_type: operation.content_types[0] ?? 'application/json',
      request_schema: operation.request_schema,
    }))
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className={sideDrawerContentClassName('sm:max-w-4xl')}>
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>
            {t(
              props.algorithm
                ? 'Edit algorithm service'
                : 'Add algorithm service'
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              'Import an OpenAPI operation and expose it through the unified algorithm endpoint.'
            )}
          </SheetDescription>
        </SheetHeader>

        <div className={sideDrawerFormClassName()}>
          <div className='grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end'>
            <Field label={t('OpenAPI URL')}>
              <Input
                value={form.openapi_url}
                onChange={(event) =>
                  setForm({ ...form, openapi_url: event.target.value })
                }
                placeholder='http://service.internal/openapi.json'
              />
            </Field>
            <Button
              type='button'
              variant='outline'
              onClick={() => importMutation.mutate()}
              disabled={!form.openapi_url || importMutation.isPending}
            >
              <Braces className='size-4' />
              {t('Import OpenAPI')}
            </Button>
          </div>

          {spec ? (
            <Field label={t('OpenAPI operation')}>
              <NativeSelect
                className='w-full'
                defaultValue=''
                onChange={(event) =>
                  selectOperation(Number(event.target.value))
                }
              >
                <NativeSelectOption value='' disabled>
                  {t('Select an operation')}
                </NativeSelectOption>
                {spec.operations.map((operation, index) => (
                  <NativeSelectOption
                    key={`${operation.method}-${operation.path}`}
                    value={index}
                  >
                    {operation.method} {operation.path} -{' '}
                    {operation.summary || operation.operation_id}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          ) : null}

          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label={t('Algorithm identifier')}>
              <Input
                value={form.name}
                disabled={Boolean(props.algorithm)}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder='mineru'
              />
            </Field>
            <Field label={t('Display name')}>
              <Input
                value={form.display_name}
                onChange={(event) =>
                  setForm({ ...form, display_name: event.target.value })
                }
              />
            </Field>
            <Field label={t('Category')}>
              <Input
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
            </Field>
            <Field label={t('Tags')}>
              <Input
                value={tagText}
                onChange={(event) => setTagText(event.target.value)}
                placeholder='PDF, OCR, Markdown'
              />
            </Field>
            <Field label={t('Base URL')}>
              <Input
                value={form.base_url}
                onChange={(event) =>
                  setForm({ ...form, base_url: event.target.value })
                }
              />
            </Field>
            <Field label={t('Operation path')}>
              <Input
                value={form.path}
                onChange={(event) =>
                  setForm({ ...form, path: event.target.value })
                }
              />
            </Field>
            <Field label={`${t('Price per call')} (${pricingCurrency.label})`}>
              <Input
                type='number'
                min='0'
                step='0.000001'
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: Number(event.target.value) })
                }
              />
            </Field>
            <Field label={t('Timeout (seconds)')}>
              <Input
                type='number'
                min='1'
                max='3600'
                value={form.timeout_seconds}
                onChange={(event) =>
                  setForm({
                    ...form,
                    timeout_seconds: Number(event.target.value),
                  })
                }
              />
            </Field>
          </div>

          <Field label={t('Description')}>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </Field>

          <div className='flex items-center justify-between rounded-lg border px-3 py-2.5'>
            <div>
              <p className='text-sm font-medium'>{t('Enabled')}</p>
              <p className='text-muted-foreground text-xs'>
                {t(
                  'Disabled algorithms cannot be invoked or shown in Algorithm Square.'
                )}
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(enabled) => setForm({ ...form, enabled })}
            />
          </div>
        </div>

        <SheetFooter className={sideDrawerFooterClassName()}>
          <Button variant='outline' onClick={() => props.onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending ||
              !form.name ||
              !form.display_name ||
              !form.base_url ||
              !form.path
            }
          >
            {t('Save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function AlgorithmTestDialog(props: {
  open: boolean
  algorithm: Algorithm | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [files, setFiles] = useState<Record<string, File[]>>({})
  const [result, setResult] = useState<{
    status: number
    duration: number
    data: string
  } | null>(null)

  const schema = useMemo<RequestSchema>(() => {
    if (!props.algorithm?.request_schema) return {}
    try {
      return JSON.parse(props.algorithm.request_schema) as RequestSchema
    } catch {
      return {}
    }
  }, [props.algorithm?.request_schema])
  const properties = useMemo(
    () => Object.entries(schema.properties ?? {}),
    [schema.properties]
  )
  const required = useMemo(
    () => new Set(schema.required ?? []),
    [schema.required]
  )

  useEffect(() => {
    if (!props.open) return
    const defaults: Record<string, string | boolean> = {}
    for (const [name, property] of properties) {
      const propertyType =
        property.type ??
        property.anyOf?.find((item) => item.type !== 'null')?.type
      if (property.default === undefined) continue
      if (propertyType === 'boolean') {
        defaults[name] = Boolean(property.default)
      } else if (Array.isArray(property.default)) {
        defaults[name] = property.default.join(', ')
      } else {
        defaults[name] = String(property.default)
      }
    }
    setValues(defaults)
    setFiles({})
    setResult(null)
  }, [properties, props.open])

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!props.algorithm) throw new Error(t('Algorithm service not found'))
      const contentType = props.algorithm.content_type
      if (contentType === 'multipart/form-data') {
        const form = new FormData()
        for (const [name, selectedFiles] of Object.entries(files)) {
          for (const file of selectedFiles) form.append(name, file)
        }
        for (const [name, value] of Object.entries(values)) {
          if (value === '') continue
          const property = schema.properties?.[name]
          if (property?.type === 'array') {
            for (const item of String(value).split(',')) {
              if (item.trim()) form.append(name, item.trim())
            }
          } else {
            form.append(name, String(value))
          }
        }
        return testAlgorithm(props.algorithm.id, form, contentType)
      }

      const payload: Record<string, unknown> = {}
      for (const [name, value] of Object.entries(values)) {
        if (value === '') continue
        const property = schema.properties?.[name]
        const propertyType =
          property?.type ??
          property?.anyOf?.find((item) => item.type !== 'null')?.type
        if (propertyType === 'integer' || propertyType === 'number') {
          payload[name] = Number(value)
        } else if (propertyType === 'array') {
          payload[name] = String(value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        } else {
          payload[name] = value
        }
      }
      if (contentType === 'application/x-www-form-urlencoded') {
        const form = new URLSearchParams()
        for (const [name, value] of Object.entries(payload)) {
          if (Array.isArray(value)) {
            for (const item of value) form.append(name, String(item))
          } else {
            form.append(name, String(value))
          }
        }
        return testAlgorithm(props.algorithm.id, form, contentType)
      }
      return testAlgorithm(props.algorithm.id, payload, contentType)
    },
    onSuccess: setResult,
    onError: (error) => toast.error(error.message),
  })

  const missingRequired = properties.some(([name, property]) => {
    if (!required.has(name)) return false
    const isFile =
      property.format === 'binary' || property.items?.format === 'binary'
    return isFile
      ? !files[name]?.length
      : values[name] === '' || values[name] === undefined
  })

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>
            {t('Test algorithm service')}: {props.algorithm?.display_name}
          </DialogTitle>
          <DialogDescription>
            {props.algorithm?.method} {props.algorithm?.base_url}
            {props.algorithm?.path}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 sm:grid-cols-2'>
          {properties.map(([name, property]) => {
            const isFile =
              property.format === 'binary' ||
              property.items?.format === 'binary'
            const propertyType =
              property.type ??
              property.anyOf?.find((item) => item.type !== 'null')?.type
            const label = property.title || name
            if (isFile) {
              return (
                <Field
                  key={name}
                  label={`${label}${required.has(name) ? ' *' : ''}`}
                  className='space-y-2 sm:col-span-2'
                >
                  <Input
                    type='file'
                    multiple={property.type === 'array'}
                    onChange={(event) =>
                      setFiles({
                        ...files,
                        [name]: [...(event.target.files ?? [])],
                      })
                    }
                  />
                  {property.description ? (
                    <p className='text-muted-foreground text-xs'>
                      {property.description}
                    </p>
                  ) : null}
                </Field>
              )
            }
            if (propertyType === 'boolean') {
              return (
                <div
                  key={name}
                  className='flex min-h-16 items-center justify-between gap-3 rounded-md border px-3 py-2'
                >
                  <div>
                    <Label>{label}</Label>
                    {property.description ? (
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                        {property.description}
                      </p>
                    ) : null}
                  </div>
                  <Switch
                    checked={Boolean(values[name])}
                    onCheckedChange={(checked) =>
                      setValues({ ...values, [name]: checked })
                    }
                  />
                </div>
              )
            }
            const options = property.enum ?? property.items?.enum
            return (
              <Field
                key={name}
                label={`${label}${required.has(name) ? ' *' : ''}`}
              >
                {options && property.type !== 'array' ? (
                  <NativeSelect
                    className='w-full'
                    value={String(values[name] ?? '')}
                    onChange={(event) =>
                      setValues({ ...values, [name]: event.target.value })
                    }
                  >
                    <NativeSelectOption value=''>
                      {t('Use service default')}
                    </NativeSelectOption>
                    {options.map((option) => (
                      <NativeSelectOption
                        key={String(option)}
                        value={String(option)}
                      >
                        {String(option)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : (
                  <Input
                    type={
                      propertyType === 'integer' || propertyType === 'number'
                        ? 'number'
                        : 'text'
                    }
                    value={String(values[name] ?? '')}
                    placeholder={
                      property.type === 'array'
                        ? t('Comma-separated values')
                        : undefined
                    }
                    onChange={(event) =>
                      setValues({ ...values, [name]: event.target.value })
                    }
                  />
                )}
                {property.description ? (
                  <p className='text-muted-foreground line-clamp-2 text-xs'>
                    {property.description}
                  </p>
                ) : null}
              </Field>
            )
          })}
          {properties.length === 0 ? (
            <p className='text-muted-foreground sm:col-span-2'>
              {t('No request fields were found in the OpenAPI schema.')}
            </p>
          ) : null}
        </div>

        {result ? (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm'>
              <Badge
                variant={
                  result.status >= 200 && result.status < 300
                    ? 'default'
                    : 'destructive'
                }
              >
                HTTP {result.status}
              </Badge>
              <span className='text-muted-foreground'>
                {result.duration} ms
              </span>
            </div>
            <pre className='bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs break-all whitespace-pre-wrap'>
              {result.data}
            </pre>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant='outline' onClick={() => props.onOpenChange(false)}>
            {t('Close')}
          </Button>
          <Button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || missingRequired}
          >
            {testMutation.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <TestTube2 className='size-4' />
            )}
            {t('Run test')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AlgorithmManagement() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const pricingCurrency = useAlgorithmPricingCurrency()
  const query = useQuery({ queryKey: ['algorithms'], queryFn: getAlgorithms })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Algorithm | null>(null)
  const [testing, setTesting] = useState<Algorithm | null>(null)
  const removeMutation = useMutation({
    mutationFn: deleteAlgorithm,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['algorithms'] }),
    onError: (error) => toast.error(error.message),
  })

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          {t('Algorithm Services')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <Button
            variant='outline'
            size='icon'
            aria-label={t('Refresh')}
            onClick={() => query.refetch()}
          >
            <RefreshCw className='size-4' />
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus className='size-4' />
            {t('Add algorithm service')}
          </Button>
        </SectionPageLayout.Actions>

        <SectionPageLayout.Content>
          {query.isError ? (
            <div className='border-destructive/40 bg-destructive/5 text-destructive mb-3 rounded-md border px-4 py-3 text-sm'>
              {query.error.message}
            </div>
          ) : null}
          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableHead>{t('Algorithm')}</TableHead>
                  <TableHead>{t('OpenAPI operation')}</TableHead>
                  <TableHead>
                    {t('Price per call')} ({pricingCurrency.label})
                  </TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className='text-right'>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className='h-14 w-full' />
                    </TableCell>
                  </TableRow>
                ) : null}
                {query.data?.map((algorithm) => (
                  <TableRow key={algorithm.id}>
                    <TableCell>
                      <p className='font-medium'>{algorithm.display_name}</p>
                      <p className='text-muted-foreground font-mono text-xs'>
                        {algorithm.name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className='font-mono text-xs'>
                        {algorithm.method} {algorithm.path}
                      </p>
                      <p className='text-muted-foreground max-w-80 truncate text-xs'>
                        {algorithm.base_url}
                      </p>
                    </TableCell>
                    <TableCell className='font-mono'>
                      {pricingCurrency.symbol}
                      {formatDisplayPriceFromUSD(
                        algorithm.price,
                        pricingCurrency.exchangeRate
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={algorithm.enabled ? 'default' : 'secondary'}
                      >
                        {t(algorithm.enabled ? 'Enabled' : 'Disabled')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={t('Test')}
                          onClick={() => setTesting(algorithm)}
                        >
                          <TestTube2 className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={t('Edit')}
                          onClick={() => {
                            setEditing(algorithm)
                            setOpen(true)
                          }}
                        >
                          <Pencil className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={t('Delete')}
                          onClick={() => {
                            if (
                              window.confirm(
                                t('Delete this algorithm service?')
                              )
                            ) {
                              removeMutation.mutate(algorithm.id)
                            }
                          }}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!query.isLoading && query.data?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-muted-foreground h-32 text-center'
                    >
                      {t('No algorithm services configured')}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <AlgorithmDialog open={open} algorithm={editing} onOpenChange={setOpen} />
      <AlgorithmTestDialog
        open={testing !== null}
        algorithm={testing}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setTesting(null)
        }}
      />
    </>
  )
}
