/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { getEvaluationRun } from './api'

export function ModelEvaluationReport(props: { runID: number }) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['evaluation-run', props.runID],
    queryFn: () => getEvaluationRun(props.runID),
  })
  const run = query.data?.run
  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Evaluation report')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button className='print:hidden' onClick={() => window.print()}>
          <Printer />
          {t('Print or save as PDF')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        {query.isLoading ? (
          <Skeleton className='h-[60vh]' />
        ) : (
          run && (
            <article className='mx-auto max-w-5xl bg-white p-8 text-black print:max-w-none print:p-0'>
              <header className='border-b-2 border-black pb-5'>
                <p className='text-sm'>星罗数场 · 智擎模型服务平台</p>
                <h1 className='mt-2 text-3xl font-semibold'>{run.name}</h1>
                <p className='mt-2 text-sm text-neutral-600'>
                  {t('Model evaluation report')}
                </p>
              </header>
              <section className='grid grid-cols-2 gap-x-8 gap-y-3 border-b py-5 text-sm sm:grid-cols-4'>
                <div>
                  <b>{t('Model')}</b>
                  <p>{run.model_name}</p>
                </div>
                <div>
                  <b>{t('Question set')}</b>
                  <p>
                    {run.question_set_name} v{run.question_set_version}
                  </p>
                </div>
                <div>
                  <b>{t('Routing mode')}</b>
                  <p>{run.mode}</p>
                </div>
                <div>
                  <b>{t('Group')}</b>
                  <p>{run.group_name}</p>
                </div>
              </section>
              <section className='grid grid-cols-2 gap-5 border-b py-5 sm:grid-cols-4'>
                <div>
                  <p className='text-xs text-neutral-500'>
                    {t('Success rate')}
                  </p>
                  <p className='text-2xl font-semibold'>
                    {run.total_count
                      ? Math.round((run.success_count / run.total_count) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <div>
                  <p className='text-xs text-neutral-500'>
                    {t('Average score')}
                  </p>
                  <p className='text-2xl font-semibold'>
                    {run.average_score ? run.average_score.toFixed(2) : '-'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-neutral-500'>
                    {t('Average latency')}
                  </p>
                  <p className='text-2xl font-semibold'>
                    {run.average_duration_ms} ms
                  </p>
                </div>
                <div>
                  <p className='text-xs text-neutral-500'>{t('Token usage')}</p>
                  <p className='text-2xl font-semibold'>
                    {run.prompt_tokens + run.completion_tokens}
                  </p>
                </div>
              </section>
              <section className='py-5'>
                <h2 className='text-lg font-semibold'>
                  {t('Question details')}
                </h2>
                <div className='mt-4 space-y-5'>
                  {query.data?.results.map((result, index) => (
                    <div
                      key={result.id}
                      className='break-inside-avoid border-b pb-5'
                    >
                      <div className='flex justify-between gap-4'>
                        <h3 className='font-semibold'>
                          {index + 1}. [{result.category}] {result.prompt}
                        </h3>
                        <span className='shrink-0'>
                          {result.status === 'success'
                            ? t('Succeeded')
                            : t('Failed')}
                        </span>
                      </div>
                      <div className='mt-3 grid gap-4 text-sm sm:grid-cols-2'>
                        <div>
                          <b>{t('Model output')}</b>
                          <p className='mt-1 whitespace-pre-wrap'>
                            {result.output || result.error_message || '-'}
                          </p>
                        </div>
                        <div>
                          <b>{t('Reference and rubric')}</b>
                          <p className='mt-1 whitespace-pre-wrap'>
                            {result.reference_answer || '-'}
                            {result.rubric && `\n${result.rubric}`}
                          </p>
                        </div>
                      </div>
                      <p className='mt-3 text-xs text-neutral-600'>
                        {t('Channel')}: {result.channel_name || '-'} ·{' '}
                        {t('Score')}: {result.score || '-'} ·{' '}
                        {result.duration_ms} ms · {result.prompt_tokens}/
                        {result.completion_tokens} Token
                      </p>
                      {result.comment && (
                        <p className='mt-1 text-sm'>
                          {t('Comment')}: {result.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </article>
          )
        )}
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
