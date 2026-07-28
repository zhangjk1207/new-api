/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Download,
  Eye,
  FileDown,
  FileUp,
  FlaskConical,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { SectionPageLayout } from '@/components/layout'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toIntlLocale } from '@/i18n/languages'
import { cn } from '@/lib/utils'

import {
  deleteQuestionSet,
  downloadEvaluationExcel,
  type EvaluationQuestion,
  type EvaluationQuestionSet,
  type EvaluationResult,
  getEvaluationOptions,
  getEvaluationRun,
  getEvaluationRuns,
  getQuestionSets,
  importQuestionSet,
  saveQuestionSet,
  scoreEvaluationResult,
  startEvaluationRun,
} from './api'

const emptyQuestion = (): Omit<EvaluationQuestion, 'id'> => ({
  category: '',
  prompt: '',
  reference_answer: '',
  rubric: '',
})

function statusBadge(status: string, t: (key: string) => string) {
  const labels: Record<string, string> = {
    pending: t('Pending'),
    running: t('Running'),
    completed: t('Completed'),
    failed: t('Failed'),
    success: t('Succeeded'),
  }
  const styles: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    running: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    failed: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  }
  return (
    <Badge variant='secondary' className={styles[status]}>
      {labels[status] ?? status}
    </Badge>
  )
}

function Metric(props: { label: string; value: string; detail: string }) {
  return (
    <div className='min-w-0 border-r px-4 first:pl-0 last:border-r-0'>
      <p className='text-muted-foreground text-xs'>{props.label}</p>
      <p className='mt-1 truncate font-mono text-xl font-semibold tabular-nums'>
        {props.value}
      </p>
      <p className='text-muted-foreground mt-1 truncate text-xs'>
        {props.detail}
      </p>
    </div>
  )
}

function CreateRunDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const sets = useQuery({
    queryKey: ['evaluation-question-sets'],
    queryFn: getQuestionSets,
  })
  const options = useQuery({
    queryKey: ['evaluation-options'],
    queryFn: getEvaluationOptions,
  })
  const [form, setForm] = useState({
    name: '',
    question_set_id: 0,
    model_name: '',
    mode: 'routing' as 'routing' | 'fixed_channel',
    channel_id: 0,
    group_name: 'default',
  })
  const channels = useMemo(
    () =>
      options.data?.channels.filter((item) =>
        item.models.includes(form.model_name)
      ) ?? [],
    [options.data, form.model_name]
  )
  const mutation = useMutation({
    mutationFn: startEvaluationRun,
    onSuccess: () => {
      toast.success(t('Evaluation started'))
      client.invalidateQueries({ queryKey: ['evaluation-runs'] })
      props.onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='w-[min(94vw,42rem)] !max-w-[min(94vw,42rem)]'>
        <DialogHeader>
          <DialogTitle>{t('Start evaluation')}</DialogTitle>
          <DialogDescription>
            {t('Run a saved question set against one model.')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <Label>{t('Evaluation name')}</Label>
            <Input
              className='mt-2'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('Question set')}</Label>
            <select
              className='border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 text-sm'
              value={form.question_set_id}
              onChange={(e) =>
                setForm({ ...form, question_set_id: Number(e.target.value) })
              }
            >
              <option value={0}>{t('Select')}</option>
              {sets.data?.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name} v{set.version}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t('Model')}</Label>
            <select
              className='border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 text-sm'
              value={form.model_name}
              onChange={(e) =>
                setForm({ ...form, model_name: e.target.value, channel_id: 0 })
              }
            >
              <option value=''>{t('Select')}</option>
              {options.data?.models.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t('Routing mode')}</Label>
            <select
              className='border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 text-sm'
              value={form.mode}
              onChange={(e) =>
                setForm({
                  ...form,
                  mode: e.target.value as 'routing' | 'fixed_channel',
                })
              }
            >
              <option value='routing'>{t('Normal routing')}</option>
              <option value='fixed_channel'>{t('Fixed channel')}</option>
            </select>
          </div>
          <div>
            <Label>{t('Group')}</Label>
            <select
              className='border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 text-sm'
              value={form.group_name}
              onChange={(e) => setForm({ ...form, group_name: e.target.value })}
            >
              {Object.keys(options.data?.groups ?? { default: '' }).map(
                (group) => (
                  <option key={group}>{group}</option>
                )
              )}
            </select>
          </div>
          {form.mode === 'fixed_channel' && (
            <div className='sm:col-span-2'>
              <Label>{t('Channel')}</Label>
              <select
                className='border-input mt-2 h-9 w-full rounded-md border bg-transparent px-3 text-sm'
                value={form.channel_id}
                onChange={(e) =>
                  setForm({ ...form, channel_id: Number(e.target.value) })
                }
              >
                <option value={0}>{t('Select')}</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.id} {channel.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={
              mutation.isPending ||
              !form.name ||
              !form.question_set_id ||
              !form.model_name ||
              (form.mode === 'fixed_channel' && !form.channel_id)
            }
          >
            <FlaskConical />
            {t('Start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScoreEditor(props: { runID: number; result: EvaluationResult }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [score, setScore] = useState(props.result.score)
  const [comment, setComment] = useState(props.result.comment)
  const mutation = useMutation({
    mutationFn: () =>
      scoreEvaluationResult(props.runID, props.result.id, score, comment),
    onSuccess: () => {
      toast.success(t('Score saved'))
      client.invalidateQueries({ queryKey: ['evaluation-run', props.runID] })
    },
    onError: (error) => toast.error(error.message),
  })
  return (
    <div className='grid gap-3 border-t pt-4 sm:grid-cols-[9rem_1fr_auto]'>
      <div>
        <Label>{t('Manual score')}</Label>
        <Input
          className='mt-2'
          type='number'
          min={0}
          max={5}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
        />
      </div>
      <div>
        <Label>{t('Comment')}</Label>
        <Input
          className='mt-2'
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <Button
        className='self-end'
        variant='outline'
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {t('Save')}
      </Button>
    </div>
  )
}

function RunDetailDialog(props: {
  runID: number | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['evaluation-run', props.runID],
    queryFn: () => {
      if (props.runID == null) throw new Error('run ID is required')
      return getEvaluationRun(props.runID)
    },
    enabled: props.runID != null,
    refetchInterval: (q) =>
      ['pending', 'running'].includes(q.state.data?.run.status ?? '')
        ? 2000
        : false,
  })
  const run = query.data?.run
  return (
    <Dialog open={props.runID != null} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] w-[min(96vw,90rem)] !max-w-[min(96vw,90rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{run?.name ?? t('Evaluation details')}</DialogTitle>
          <DialogDescription>
            {run
              ? `${run.model_name} · ${run.question_set_name} v${run.question_set_version}`
              : ''}
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <Skeleton className='h-96' />
        ) : (
          run && (
            <div className='space-y-5'>
              <div className='grid grid-cols-2 gap-y-4 border-y py-4 sm:grid-cols-5'>
                <Metric
                  label={t('Progress')}
                  value={`${run.completed_count}/${run.total_count}`}
                  detail={run.status}
                />
                <Metric
                  label={t('Success rate')}
                  value={
                    run.total_count
                      ? `${Math.round((run.success_count / run.total_count) * 100)}%`
                      : '-'
                  }
                  detail={t('Successful questions')}
                />
                <Metric
                  label={t('Average score')}
                  value={run.average_score ? run.average_score.toFixed(2) : '-'}
                  detail={t('Out of 5')}
                />
                <Metric
                  label={t('Average latency')}
                  value={`${run.average_duration_ms} ms`}
                  detail={t('Per question')}
                />
                <Metric
                  label={t('Token usage')}
                  value={`${run.prompt_tokens + run.completion_tokens}`}
                  detail={`${run.prompt_tokens} / ${run.completion_tokens}`}
                />
              </div>
              <Progress
                value={
                  run.total_count
                    ? (run.completed_count / run.total_count) * 100
                    : 0
                }
              />
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => downloadEvaluationExcel(run.id)}
                >
                  <Download />
                  Excel
                </Button>
                <Button
                  variant='outline'
                  onClick={() =>
                    navigate({
                      to: '/model-evaluations/$runId/report',
                      params: { runId: String(run.id) },
                    })
                  }
                >
                  <FileDown />
                  PDF
                </Button>
              </div>
              <Accordion className='rounded-md border'>
                {query.data?.results.map((result, index) => (
                  <AccordionItem
                    key={result.id}
                    value={String(result.id)}
                    className='px-4'
                  >
                    <AccordionTrigger>
                      <div className='flex min-w-0 items-center gap-3 text-left'>
                        <span className='text-muted-foreground w-7 font-mono'>
                          {index + 1}
                        </span>
                        {statusBadge(result.status, t)}
                        <span className='truncate'>
                          {result.category} · {result.prompt}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className='space-y-4 pb-3'>
                        <section>
                          <h4 className='text-muted-foreground text-xs font-medium'>
                            {t('Prompt')}
                          </h4>
                          <p className='mt-1 whitespace-pre-wrap'>
                            {result.prompt}
                          </p>
                        </section>
                        <div className='grid gap-4 lg:grid-cols-2'>
                          <section>
                            <h4 className='text-muted-foreground text-xs font-medium'>
                              {t('Model output')}
                            </h4>
                            <div className='bg-muted/30 mt-2 min-h-24 rounded-md border p-3 whitespace-pre-wrap'>
                              {result.output || result.error_message || '-'}
                            </div>
                          </section>
                          <section>
                            <h4 className='text-muted-foreground text-xs font-medium'>
                              {t('Reference and rubric')}
                            </h4>
                            <div className='bg-muted/30 mt-2 min-h-24 rounded-md border p-3 whitespace-pre-wrap'>
                              {result.reference_answer || '-'}
                              {result.rubric && `\n\n${result.rubric}`}
                            </div>
                          </section>
                        </div>
                        {result.reasoning && (
                          <section>
                            <h4 className='text-muted-foreground text-xs font-medium'>
                              {t('Reasoning')}
                            </h4>
                            <div className='bg-muted/30 mt-2 max-h-52 overflow-auto rounded-md border p-3 whitespace-pre-wrap'>
                              {result.reasoning}
                            </div>
                          </section>
                        )}
                        <p className='text-muted-foreground font-mono text-xs'>
                          {result.channel_name || '-'} · TTFT{' '}
                          {result.first_token_ms} ms · {result.duration_ms} ms ·{' '}
                          {result.prompt_tokens}/{result.completion_tokens}{' '}
                          Token
                        </p>
                        {result.status === 'success' && (
                          <ScoreEditor runID={run.id} result={result} />
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

function QuestionSetDialog(props: {
  value: EvaluationQuestionSet | null | undefined
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const isNew = props.value === null
  const [name, setName] = useState(props.value?.name ?? '')
  const [description, setDescription] = useState(props.value?.description ?? '')
  const [questions, setQuestions] = useState<Omit<EvaluationQuestion, 'id'>[]>(
    props.value?.questions.map(({ id: _, ...question }) => question) ?? [
      emptyQuestion(),
    ]
  )
  const mutation = useMutation({
    mutationFn: () =>
      saveQuestionSet({ id: props.value?.id, name, description, questions }),
    onSuccess: () => {
      toast.success(t('Question set saved'))
      client.invalidateQueries({ queryKey: ['evaluation-question-sets'] })
      props.onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })
  return (
    <Dialog open={props.value !== undefined} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] w-[min(96vw,72rem)] !max-w-[min(96vw,72rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('Create question set') : t('Edit question set')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Used question sets become immutable; create a new version for later changes.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <Label>{t('Name')}</Label>
            <Input
              className='mt-2'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>{t('Description')}</Label>
            <Input
              className='mt-2'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className='space-y-3'>
          {questions.map((question, index) => (
            <div
              key={`${question.category}:${question.prompt}`}
              className='grid gap-3 rounded-md border p-3 sm:grid-cols-[10rem_1fr_auto]'
            >
              <Input
                placeholder={t('Category')}
                value={question.category}
                onChange={(e) =>
                  setQuestions(
                    questions.map((item, i) =>
                      i === index ? { ...item, category: e.target.value } : item
                    )
                  )
                }
              />
              <Textarea
                placeholder={t('Question')}
                value={question.prompt}
                onChange={(e) =>
                  setQuestions(
                    questions.map((item, i) =>
                      i === index ? { ...item, prompt: e.target.value } : item
                    )
                  )
                }
              />
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('Delete')}
                onClick={() =>
                  setQuestions(questions.filter((_, i) => i !== index))
                }
              >
                <Trash2 />
              </Button>
              <div className='grid gap-3 sm:col-start-2 sm:grid-cols-2'>
                <Textarea
                  placeholder={t('Reference answer')}
                  value={question.reference_answer}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((item, i) =>
                        i === index
                          ? { ...item, reference_answer: e.target.value }
                          : item
                      )
                    )
                  }
                />
                <Textarea
                  placeholder={t('Rubric')}
                  value={question.rubric}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((item, i) =>
                        i === index ? { ...item, rubric: e.target.value } : item
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          variant='outline'
          onClick={() => setQuestions([...questions, emptyQuestion()])}
        >
          <Plus />
          {t('Add question')}
        </Button>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name || !questions.length}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImportDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('file is required')
      const form = new FormData()
      form.set('name', name)
      form.set('description', description)
      form.set('file', file)
      return importQuestionSet(form)
    },
    onSuccess: () => {
      toast.success(t('Question set imported'))
      client.invalidateQueries({ queryKey: ['evaluation-question-sets'] })
      props.onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Import question set')}</DialogTitle>
          <DialogDescription>
            {t('Supports XLSX and JSONL files.')}
          </DialogDescription>
        </DialogHeader>
        <Label>{t('Name')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Label>{t('Description')}</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          type='file'
          accept='.xlsx,.jsonl'
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name || !file || mutation.isPending}
          >
            <FileUp />
            {t('Import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ModelEvaluation() {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const client = useQueryClient()
  const runs = useQuery({
    queryKey: ['evaluation-runs'],
    queryFn: getEvaluationRuns,
    refetchInterval: (q) =>
      q.state.data?.some((item) => ['pending', 'running'].includes(item.status))
        ? 3000
        : false,
  })
  const sets = useQuery({
    queryKey: ['evaluation-question-sets'],
    queryFn: getQuestionSets,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [detailID, setDetailID] = useState<number | null>(null)
  const [setEditor, setSetEditor] = useState<
    EvaluationQuestionSet | null | undefined
  >(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const remove = useMutation({
    mutationFn: deleteQuestionSet,
    onSuccess: () => {
      toast.success(t('Question set deleted'))
      client.invalidateQueries({ queryKey: ['evaluation-question-sets'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const completed = runs.data?.filter((run) => run.status === 'completed') ?? []
  const success = completed.reduce((sum, run) => sum + run.success_count, 0)
  const total = completed.reduce((sum, run) => sum + run.total_count, 0)
  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Model Evaluation')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          size='icon'
          aria-label={t('Refresh')}
          onClick={() => {
            runs.refetch()
            sets.refetch()
          }}
        >
          <RefreshCw
            className={cn(
              'size-4',
              (runs.isFetching || sets.isFetching) && 'animate-spin'
            )}
          />
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <FlaskConical />
          {t('Start evaluation')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto max-w-[1600px] space-y-5 pb-5'>
          <section className='grid grid-cols-2 gap-y-4 border-b pb-5 sm:grid-cols-4'>
            <Metric
              label={t('Evaluation runs')}
              value={String(runs.data?.length ?? 0)}
              detail={t('All time')}
            />
            <Metric
              label={t('Completed runs')}
              value={String(completed.length)}
              detail={t('Ready for reporting')}
            />
            <Metric
              label={t('Overall pass rate')}
              value={total ? `${Math.round((success / total) * 100)}%` : '-'}
              detail={`${success}/${total}`}
            />
            <Metric
              label={t('Question sets')}
              value={String(sets.data?.length ?? 0)}
              detail={t('Versioned library')}
            />
          </section>
          <Tabs defaultValue='runs'>
            <TabsList>
              <TabsTrigger value='runs'>{t('Evaluation runs')}</TabsTrigger>
              <TabsTrigger value='questions'>{t('Question sets')}</TabsTrigger>
            </TabsList>
            <TabsContent
              value='runs'
              className='mt-4 overflow-hidden rounded-md border'
            >
              {runs.isLoading ? (
                <Skeleton className='h-64' />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Name')}</TableHead>
                      <TableHead>{t('Model')}</TableHead>
                      <TableHead>{t('Question set')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead>{t('Progress')}</TableHead>
                      <TableHead>{t('Average score')}</TableHead>
                      <TableHead>{t('Created at')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.data?.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className='font-medium'>
                          {run.name}
                        </TableCell>
                        <TableCell className='font-mono'>
                          {run.model_name}
                        </TableCell>
                        <TableCell>
                          {run.question_set_name} v{run.question_set_version}
                        </TableCell>
                        <TableCell>{statusBadge(run.status, t)}</TableCell>
                        <TableCell>
                          {run.completed_count}/{run.total_count}
                        </TableCell>
                        <TableCell>
                          {run.average_score
                            ? run.average_score.toFixed(2)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(run.created_at))}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={t('View')}
                            onClick={() => setDetailID(run.id)}
                          >
                            <Eye />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value='questions' className='mt-4'>
              <div className='mb-3 flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setImportOpen(true)}>
                  <FileUp />
                  {t('Import')}
                </Button>
                <Button onClick={() => setSetEditor(null)}>
                  <Plus />
                  {t('Create question set')}
                </Button>
              </div>
              <div className='overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Name')}</TableHead>
                      <TableHead>{t('Version')}</TableHead>
                      <TableHead>{t('Questions')}</TableHead>
                      <TableHead>{t('Description')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sets.data?.map((set) => (
                      <TableRow key={set.id}>
                        <TableCell className='font-medium'>
                          {set.name}
                        </TableCell>
                        <TableCell>v{set.version}</TableCell>
                        <TableCell>{set.questions.length}</TableCell>
                        <TableCell className='max-w-96 truncate'>
                          {set.description}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            onClick={() => setSetEditor(set)}
                          >
                            {t('Edit')}
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={t('Delete')}
                            onClick={() => remove.mutate(set.id)}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <CreateRunDialog open={createOpen} onOpenChange={setCreateOpen} />
        <RunDetailDialog
          runID={detailID}
          onOpenChange={(open) => !open && setDetailID(null)}
        />
        <QuestionSetDialog
          key={setEditor === undefined ? 'closed' : (setEditor?.id ?? 'new')}
          value={setEditor}
          onOpenChange={(open) => !open && setSetEditor(undefined)}
        />
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
