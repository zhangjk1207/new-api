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
  ArrowLeft,
  Braces,
  Clock3,
  Code2,
  FileInput,
  KeyRound,
  ReceiptText,
  Send,
  Tags,
} from 'lucide-react'
import { type ComponentType, type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BundledLanguage } from 'shiki/bundle/web'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Algorithm } from '@/features/algorithm-management/api'
import { formatDisplayPriceFromUSD } from '@/features/system-settings/models/pricing-format'
import { getRuntimeServerBaseUrl } from '@/lib/runtime-base-path'
import { useSystemConfigStore } from '@/stores/system-config-store'

type SchemaValue = string | number | boolean | null

type JsonSchema = {
  type?: string
  format?: string
  description?: string
  default?: SchemaValue
  enum?: SchemaValue[]
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
  required?: string[]
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
}

type RequestParameter = {
  name: string
  type: string
  required: boolean
  defaultValue?: SchemaValue
  description: string
  schema: JsonSchema
}

type SampleLanguage = 'curl' | 'python' | 'typescript' | 'javascript'

const SAMPLE_LABELS: Record<SampleLanguage, string> = {
  curl: 'cURL',
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
}

const SAMPLE_HIGHLIGHT: Record<SampleLanguage, BundledLanguage> = {
  curl: 'bash',
  python: 'python',
  typescript: 'typescript',
  javascript: 'javascript',
}

function parseRequestSchema(value: string): JsonSchema {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as JsonSchema) : {}
  } catch {
    return {}
  }
}

function concreteSchema(schema: JsonSchema): JsonSchema {
  const candidates = schema.anyOf ?? schema.oneOf
  return candidates?.find((candidate) => candidate.type !== 'null') ?? schema
}

function schemaType(schema: JsonSchema): string {
  const concrete = concreteSchema(schema)
  if (concrete.type === 'array') {
    const item = concrete.items ? concreteSchema(concrete.items) : undefined
    if (item?.format === 'binary') return 'file[]'
    const itemType = item?.type ?? typeof item?.enum?.[0]
    return `${itemType === 'undefined' ? 'value' : itemType}[]`
  }
  if (concrete.format === 'binary') return 'file'
  return concrete.type ?? 'value'
}

function requestParameters(schema: JsonSchema): RequestParameter[] {
  const root = concreteSchema(schema)
  const required = new Set(root.required ?? [])
  return Object.entries(root.properties ?? {}).map(([name, property]) => {
    const concrete = concreteSchema(property)
    return {
      name,
      type: schemaType(property),
      required: required.has(name),
      defaultValue: concrete.default,
      description: concrete.description ?? property.description ?? '',
      schema: property,
    }
  })
}

function sampleValue(parameter: RequestParameter): SchemaValue | SchemaValue[] {
  const schema = concreteSchema(parameter.schema)
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]
  if (schema.type === 'boolean') return false
  if (schema.type === 'integer' || schema.type === 'number') return 0
  if (schema.type === 'array') {
    const item = concreteSchema(schema.items ?? {})
    if (item.enum?.length) return [item.enum[0]]
    if (item.type === 'number' || item.type === 'integer') return [0]
    return ['value']
  }
  return `<${parameter.name}>`
}

function sampleParameters(parameters: RequestParameter[]): RequestParameter[] {
  const required = parameters.filter(
    (parameter) =>
      parameter.required ||
      parameter.type === 'file' ||
      parameter.type === 'file[]'
  )
  const optionalDefaults = parameters.filter(
    (parameter) =>
      !required.includes(parameter) && parameter.defaultValue !== undefined
  )
  const selected = [
    ...required,
    ...optionalDefaults.slice(0, Math.max(0, 6 - required.length)),
  ]
  return selected.length > 0 ? selected : parameters.slice(0, 4)
}

function escapeSingleQuote(value: SchemaValue | SchemaValue[]): string {
  const text = Array.isArray(value) ? value.join(',') : String(value ?? '')
  return text.replaceAll("'", "'\\''")
}

function buildJsonBody(
  parameters: RequestParameter[]
): Record<string, unknown> {
  return Object.fromEntries(
    sampleParameters(parameters)
      .filter(
        (parameter) => parameter.type !== 'file' && parameter.type !== 'file[]'
      )
      .map((parameter) => [parameter.name, sampleValue(parameter)])
  )
}

function buildFormEntries(parameters: RequestParameter[]) {
  return sampleParameters(parameters).map((parameter) => ({
    parameter,
    value: sampleValue(parameter),
  }))
}

function pythonLiteral(value: unknown): string {
  if (value === null) return 'None'
  if (value === true) return 'True'
  if (value === false) return 'False'
  if (Array.isArray(value)) {
    return `[${value.map((item) => pythonLiteral(item)).join(', ')}]`
  }
  if (typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${JSON.stringify(key)}: ${pythonLiteral(item)}`)
      .join(', ')}}`
  }
  return JSON.stringify(value)
}

function buildCodeSample(
  language: SampleLanguage,
  endpoint: string,
  contentType: string,
  parameters: RequestParameter[]
): string {
  const isMultipart = contentType.includes('multipart/form-data')
  const isUrlEncoded = contentType.includes('application/x-www-form-urlencoded')

  if (!isMultipart && !isUrlEncoded) {
    const body = JSON.stringify(buildJsonBody(parameters), null, 2)
    if (language === 'curl') {
      return [
        `curl -X POST '${endpoint}' \\`,
        '  -H "Authorization: Bearer $API_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        `  -d '${body.replaceAll('\n', '\n     ')}'`,
      ].join('\n')
    }
    if (language === 'python') {
      const pythonBody = pythonLiteral(buildJsonBody(parameters))
      return [
        'import requests',
        '',
        `response = requests.post(`,
        `    '${endpoint}',`,
        `    headers={'Authorization': 'Bearer <YOUR_API_KEY>'},`,
        `    json=${pythonBody},`,
        ')',
        'response.raise_for_status()',
        'print(response.json())',
      ].join('\n')
    }
    const apiKey =
      language === 'typescript'
        ? 'process.env.API_KEY as string'
        : 'process.env.API_KEY'
    return [
      `const response = await fetch('${endpoint}', {`,
      `  method: 'POST',`,
      `  headers: {`,
      `    Authorization: \`Bearer \${${apiKey}}\`,`,
      `    'Content-Type': 'application/json',`,
      `  },`,
      `  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),`,
      `})`,
      '',
      'if (!response.ok) throw new Error(await response.text())',
      'console.log(await response.json())',
    ].join('\n')
  }

  const entries = buildFormEntries(parameters)
  if (language === 'curl') {
    const flag = isMultipart ? '-F' : '--data-urlencode'
    const requestLines = entries.map(({ parameter, value }, index) => {
      const suffix = index === entries.length - 1 ? '' : ' \\'
      const fieldValue =
        parameter.type === 'file' || parameter.type === 'file[]'
          ? `${parameter.name}=@/path/to/file`
          : `${parameter.name}=${escapeSingleQuote(value)}`
      return `  ${flag} '${fieldValue}'${suffix}`
    })
    return [
      `curl -X POST '${endpoint}' \\`,
      `  -H "Authorization: Bearer $API_KEY"${entries.length ? ' \\' : ''}`,
      ...requestLines,
    ].join('\n')
  }

  if (language === 'python') {
    const textEntries = entries.filter(
      ({ parameter }) =>
        parameter.type !== 'file' && parameter.type !== 'file[]'
    )
    const fileEntries = entries.filter(
      ({ parameter }) =>
        parameter.type === 'file' || parameter.type === 'file[]'
    )
    const textBody = Object.fromEntries(
      textEntries.map(({ parameter, value }) => [parameter.name, value])
    )
    return [
      'import requests',
      '',
      `response = requests.post(`,
      `    '${endpoint}',`,
      `    headers={'Authorization': 'Bearer <YOUR_API_KEY>'},`,
      ...(textEntries.length ? [`    data=${pythonLiteral(textBody)},`] : []),
      ...(fileEntries.length
        ? [
            `    files={${fileEntries
              .map(
                ({ parameter }) =>
                  `'${parameter.name}': open('/path/to/file', 'rb')`
              )
              .join(', ')}},`,
          ]
        : []),
      ')',
      'response.raise_for_status()',
      'print(response.text)',
    ].join('\n')
  }

  const bodyVariable = isMultipart ? 'form' : 'params'
  const initialization = isMultipart
    ? ['const form = new FormData()']
    : ['const params = new URLSearchParams()']
  const appendLines = entries.map(({ parameter, value }) => {
    if (parameter.type === 'file' || parameter.type === 'file[]') {
      return `form.append('${parameter.name}', fileInput.files[0])`
    }
    const textValue = Array.isArray(value)
      ? value.join(',')
      : String(value ?? '')
    return `${bodyVariable}.append('${parameter.name}', ${JSON.stringify(textValue)})`
  })
  return [
    ...initialization,
    ...(entries.some(
      ({ parameter }) =>
        parameter.type === 'file' || parameter.type === 'file[]'
    )
      ? [
          language === 'typescript'
            ? "const fileInput = document.querySelector<HTMLInputElement>('#file')!"
            : "const fileInput = document.querySelector('#file')",
        ]
      : []),
    ...appendLines,
    '',
    `const response = await fetch('${endpoint}', {`,
    `  method: 'POST',`,
    `  headers: { Authorization: 'Bearer <YOUR_API_KEY>' },`,
    `  body: ${bodyVariable},`,
    `})`,
    '',
    'if (!response.ok) throw new Error(await response.text())',
    'console.log(await response.text())',
  ].join('\n')
}

function usePricingCurrency() {
  const currency = useSystemConfigStore((state) => state.config.currency)
  if (currency.quotaDisplayType === 'CNY') {
    return {
      symbol: '¥',
      exchangeRate: currency.usdExchangeRate > 0 ? currency.usdExchangeRate : 1,
    }
  }
  if (currency.quotaDisplayType === 'CUSTOM') {
    return {
      symbol: currency.customCurrencySymbol || '¤',
      exchangeRate:
        currency.customCurrencyExchangeRate > 0
          ? currency.customCurrencyExchangeRate
          : 1,
    }
  }
  return { symbol: '$', exchangeRate: 1 }
}

function SectionTitle(props: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  const Icon = props.icon
  return (
    <h3 className='mb-3 flex items-center gap-1.5 text-sm font-semibold'>
      <Icon className='text-muted-foreground/70 size-3.5' aria-hidden='true' />
      {props.children}
    </h3>
  )
}

function SummaryItem(props: {
  label: string
  value: ReactNode
  icon: ComponentType<{ className?: string }>
}) {
  const Icon = props.icon
  return (
    <div className='min-w-0 px-4 py-3 first:pl-0 sm:first:pl-4'>
      <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        <Icon className='size-3.5' aria-hidden='true' />
        {props.label}
      </p>
      <div className='mt-1.5 truncate text-sm font-semibold'>{props.value}</div>
    </div>
  )
}

export function AlgorithmDetailsContent(props: {
  algorithm: Algorithm
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<SampleLanguage>('curl')
  const schema = useMemo(
    () => parseRequestSchema(props.algorithm.request_schema),
    [props.algorithm.request_schema]
  )
  const parameters = useMemo(() => requestParameters(schema), [schema])
  const endpoint = `${getRuntimeServerBaseUrl()}/v1/algorithms/invoke?algorithm=${encodeURIComponent(props.algorithm.name)}`
  const code = useMemo(
    () =>
      buildCodeSample(
        language,
        endpoint,
        props.algorithm.content_type,
        parameters
      ),
    [endpoint, language, parameters, props.algorithm.content_type]
  )
  const pricingCurrency = usePricingCurrency()
  const price = Number(
    formatDisplayPriceFromUSD(
      props.algorithm.price,
      pricingCurrency.exchangeRate
    )
  )

  return (
    <div className='space-y-4'>
      <Button
        variant='ghost'
        size='sm'
        onClick={props.onBack}
        className='text-muted-foreground hover:text-foreground h-auto gap-1 px-0 py-1 text-xs'
      >
        <ArrowLeft className='size-3.5' aria-hidden='true' />
        {t('Back')}
      </Button>

      <header className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary' className='rounded-md'>
            {props.algorithm.category || t('Other')}
          </Badge>
          <Badge
            variant='outline'
            className='rounded-md border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          >
            {t('Ready')}
          </Badge>
          <span className='text-muted-foreground font-mono text-xs'>
            {props.algorithm.version || 'OpenAPI'}
          </span>
        </div>
        <div>
          <h1 className='text-2xl font-bold sm:text-3xl'>
            {props.algorithm.display_name}
          </h1>
          <p className='text-muted-foreground mt-2 max-w-3xl text-sm leading-6'>
            {props.algorithm.description || t('No description')}
          </p>
        </div>
        {props.algorithm.tags.length > 0 ? (
          <div className='flex flex-wrap gap-1.5'>
            {props.algorithm.tags.map((tag) => (
              <Badge
                key={tag}
                variant='outline'
                className='rounded-md font-normal'
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <Tabs defaultValue='overview' className='gap-4'>
        <TabsList className='bg-muted/60 grid w-full grid-cols-2 gap-1 rounded-lg p-1 group-data-horizontal/tabs:h-auto'>
          <TabsTrigger value='overview' className='h-8 gap-1.5 rounded-md'>
            <Braces className='size-3.5' aria-hidden='true' />
            {t('Overview')}
          </TabsTrigger>
          <TabsTrigger value='api' className='h-8 gap-1.5 rounded-md'>
            <Code2 className='size-3.5' aria-hidden='true' />
            {t('Invocation guide')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6 outline-none'>
          <div className='grid divide-y rounded-lg border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4'>
            <SummaryItem icon={Send} label={t('Method')} value='POST' />
            <SummaryItem
              icon={FileInput}
              label={t('Request content type')}
              value={props.algorithm.content_type || 'application/json'}
            />
            <SummaryItem
              icon={Clock3}
              label={t('Timeout')}
              value={t('{{seconds}} seconds', {
                seconds: props.algorithm.timeout_seconds,
              })}
            />
            <SummaryItem
              icon={ReceiptText}
              label={t('Price per call')}
              value={
                price === 0
                  ? t('Free of charge')
                  : `${pricingCurrency.symbol}${formatDisplayPriceFromUSD(
                      props.algorithm.price,
                      pricingCurrency.exchangeRate
                    )}`
              }
            />
          </div>

          <section>
            <SectionTitle icon={Tags}>
              {t('Capability information')}
            </SectionTitle>
            <dl className='grid overflow-hidden rounded-lg border sm:grid-cols-2'>
              {[
                [t('Algorithm identifier'), props.algorithm.name],
                [t('Version'), props.algorithm.version || 'OpenAPI'],
                [t('Category'), props.algorithm.category || t('Other')],
                [t('Response'), t('OpenAPI response')],
              ].map(([label, value]) => (
                <div key={label} className='border-b px-4 py-3 sm:odd:border-r'>
                  <dt className='text-muted-foreground text-xs'>{label}</dt>
                  <dd className='mt-1 text-sm font-medium break-words'>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <SectionTitle icon={FileInput}>
              {t('Request parameters')}
            </SectionTitle>
            {parameters.length > 0 ? (
              <div className='overflow-hidden rounded-lg border'>
                <Table>
                  <TableHeader className='bg-muted/35'>
                    <TableRow>
                      <TableHead>{t('Parameter')}</TableHead>
                      <TableHead>{t('Type')}</TableHead>
                      <TableHead>{t('Required')}</TableHead>
                      <TableHead>{t('Default')}</TableHead>
                      <TableHead className='min-w-64'>
                        {t('Description')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parameters.map((parameter) => (
                      <TableRow key={parameter.name}>
                        <TableCell className='font-mono font-medium'>
                          {parameter.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='secondary'
                            className='rounded-md font-mono'
                          >
                            {parameter.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {parameter.required ? t('Required') : t('Optional')}
                        </TableCell>
                        <TableCell className='font-mono'>
                          {parameter.defaultValue === undefined
                            ? '-'
                            : String(parameter.defaultValue)}
                        </TableCell>
                        <TableCell className='text-muted-foreground whitespace-normal'>
                          {parameter.description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className='text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm'>
                {t('No request fields were found in the OpenAPI schema.')}
              </p>
            )}
          </section>
        </TabsContent>

        <TabsContent value='api' className='space-y-6 outline-none'>
          <section>
            <SectionTitle icon={Send}>{t('Unified endpoint')}</SectionTitle>
            <div className='grid gap-3 rounded-lg border p-4 sm:grid-cols-[100px_minmax(0,1fr)] sm:items-center'>
              <span className='w-fit rounded bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
                POST
              </span>
              <code className='min-w-0 font-mono text-sm break-all'>
                {endpoint}
              </code>
            </div>
            <p className='text-muted-foreground mt-2 text-xs leading-5'>
              {t(
                'The unified endpoint forwards the request to the configured algorithm service.'
              )}
            </p>
          </section>

          <section>
            <SectionTitle icon={KeyRound}>{t('Authentication')}</SectionTitle>
            <div className='rounded-lg border p-4'>
              <code className='font-mono text-sm'>
                Authorization: Bearer {'<YOUR_API_KEY>'}
              </code>
              <p className='text-muted-foreground mt-2 text-xs'>
                {t('Use an API key created in API Keys.')}
              </p>
            </div>
          </section>

          <section>
            <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
              <SectionTitle icon={Code2}>{t('Code samples')}</SectionTitle>
              <Tabs
                value={language}
                onValueChange={(value) => setLanguage(value as SampleLanguage)}
              >
                <TabsList className='bg-muted/40 h-8 p-0.5'>
                  {(Object.keys(SAMPLE_LABELS) as SampleLanguage[]).map(
                    (sampleLanguage) => (
                      <TabsTrigger
                        key={sampleLanguage}
                        value={sampleLanguage}
                        className='h-7 px-2.5 text-xs'
                      >
                        {SAMPLE_LABELS[sampleLanguage]}
                      </TabsTrigger>
                    )
                  )}
                </TabsList>
              </Tabs>
            </div>
            <CodeBlock code={code} language={SAMPLE_HIGHLIGHT[language]}>
              <CodeBlockCopyButton />
            </CodeBlock>
            <p className='text-muted-foreground mt-2 text-xs leading-5'>
              {t(
                'The upstream response is returned with its original status code and content type.'
              )}
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
