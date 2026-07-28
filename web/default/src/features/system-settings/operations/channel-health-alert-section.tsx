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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  BellRing,
  CircleAlert,
  Eye,
  EyeOff,
  PlugZap,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as z from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  getChannelHealthAlertConfig,
  testChannelHealthAlert,
  updateChannelHealthAlertConfig,
} from '../api'
import { FormDirtyIndicator } from '../components/form-dirty-indicator'
import {
  SettingsControlGroup,
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageActionsPortal } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import type {
  ChannelHealthAlertConfig,
  ChannelHealthAlertUpdate,
} from '../types'

const channelAlertSchema = z.object({
  enabled: z.boolean(),
  check_interval_minutes: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(5),
    z.literal(10),
  ]),
  failure_threshold: z.number().int().min(2).max(10),
  recovery_enabled: z.boolean(),
  wecom_webhook_url: z.string(),
  clear_webhook: z.boolean(),
  environment: z.string().trim().min(1).max(64),
})

type ChannelAlertFormInput = z.input<typeof channelAlertSchema>
type ChannelAlertFormValues = z.output<typeof channelAlertSchema>

const emptyForm: ChannelAlertFormInput = {
  enabled: false,
  check_interval_minutes: 1,
  failure_threshold: 3,
  recovery_enabled: true,
  wecom_webhook_url: '',
  clear_webhook: false,
  environment: '智擎模型服务平台',
}

function configToForm(config: ChannelHealthAlertConfig): ChannelAlertFormInput {
  return {
    enabled: config.enabled,
    check_interval_minutes: config.check_interval_minutes,
    failure_threshold: config.failure_threshold,
    recovery_enabled: config.recovery_enabled,
    wecom_webhook_url: '',
    clear_webhook: false,
    environment: config.environment,
  }
}

export function ChannelHealthAlertSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showWebhook, setShowWebhook] = useState(false)
  const query = useQuery({
    queryKey: ['channel-health-alert-config'],
    queryFn: getChannelHealthAlertConfig,
  })
  const form = useForm<ChannelAlertFormInput, unknown, ChannelAlertFormValues>({
    resolver: zodResolver(channelAlertSchema),
    defaultValues: emptyForm,
  })

  useEffect(() => {
    if (query.data) form.reset(configToForm(query.data))
  }, [form, query.data])

  const updateMutation = useMutation({
    mutationFn: (request: ChannelHealthAlertUpdate) =>
      updateChannelHealthAlertConfig(request),
    onSuccess: (config) => {
      queryClient.setQueryData(['channel-health-alert-config'], config)
      form.reset(configToForm(config))
      toast.success(t('Channel alert settings saved'))
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const testMutation = useMutation({
    mutationFn: testChannelHealthAlert,
    onSuccess: async () => {
      toast.success(t('Test message sent'))
      await queryClient.invalidateQueries({
        queryKey: ['channel-health-alert-config'],
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const submit = (values: ChannelAlertFormValues) => {
    updateMutation.mutate(values)
  }
  const testCurrentWebhook = () => {
    const values = form.getValues()
    if (
      !values.wecom_webhook_url.trim() &&
      (!query.data?.webhook_configured || values.clear_webhook)
    ) {
      toast.error(t('Enter an enterprise WeChat Webhook first'))
      return
    }
    testMutation.mutate({
      wecom_webhook_url: values.wecom_webhook_url.trim(),
      environment: values.environment.trim(),
    })
  }

  if (query.isLoading) {
    return (
      <div className='text-muted-foreground flex min-h-40 items-center justify-center text-sm'>
        {t('Loading channel alert settings...')}
      </div>
    )
  }
  if (query.isError) {
    return (
      <Alert variant='destructive'>
        <CircleAlert />
        <AlertTitle>{t('Failed to load channel alert settings')}</AlertTitle>
        <AlertDescription>{query.error.message}</AlertDescription>
      </Alert>
    )
  }

  const configured = query.data?.webhook_configured ?? false
  const clearWebhook = form.watch('clear_webhook')
  const webhookValue = form.watch('wecom_webhook_url')
  const alertsEnabled = form.watch('enabled')
  const lastDelivery = query.data?.last_delivery
  let webhookStatus = <Badge variant='outline'>{t('Not configured')}</Badge>
  if (configured) {
    webhookStatus = (
      <Badge variant='outline'>
        {t('Configured')} {query.data?.webhook_masked}
      </Badge>
    )
  }
  if (webhookValue) {
    webhookStatus = <Badge variant='secondary'>{t('New Webhook')}</Badge>
  }
  if (clearWebhook) {
    webhookStatus = <Badge variant='destructive'>{t('Pending removal')}</Badge>
  }

  return (
    <SettingsSection title={t('Channel Alerts')}>
      <FormDirtyIndicator isDirty={form.formState.isDirty} />
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(submit)}>
          <SettingsPageActionsPortal>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => query.data && form.reset(configToForm(query.data))}
              disabled={!form.formState.isDirty || updateMutation.isPending}
            >
              <RotateCcw data-icon='inline-start' />
              {t('Reset')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={testCurrentWebhook}
              disabled={testMutation.isPending}
            >
              <PlugZap data-icon='inline-start' />
              {testMutation.isPending ? t('Testing...') : t('Send Test')}
            </Button>
            <Button
              type='button'
              size='sm'
              onClick={form.handleSubmit(submit)}
              disabled={updateMutation.isPending}
            >
              <Save data-icon='inline-start' />
              {updateMutation.isPending ? t('Saving...') : t('Save Changes')}
            </Button>
          </SettingsPageActionsPortal>

          <div className='flex items-start gap-3 border-b pb-5'>
            <div className='bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg'>
              <BellRing className='size-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-sm font-semibold'>
                  {t('Enterprise WeChat notifications')}
                </h3>
                {webhookStatus}
              </div>
              {lastDelivery?.last_attempt_at ? (
                <p className='text-muted-foreground mt-1 text-xs'>
                  {lastDelivery.last_success
                    ? t('Last delivery succeeded at {{time}}', {
                        time: dayjs
                          .unix(lastDelivery.last_attempt_at)
                          .format('YYYY-MM-DD HH:mm:ss'),
                      })
                    : t('Last delivery failed at {{time}}: {{error}}', {
                        time: dayjs
                          .unix(lastDelivery.last_attempt_at)
                          .format('YYYY-MM-DD HH:mm:ss'),
                        error: lastDelivery.last_error,
                      })}
                </p>
              ) : null}
            </div>
          </div>

          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Enable channel alerts')}</FormLabel>
                  <FormDescription>
                    {t('Notify when an enabled channel becomes unavailable.')}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />

          <FormField
            control={form.control}
            name='wecom_webhook_url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Enterprise WeChat Webhook')}</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput
                      type={showWebhook ? 'text' : 'password'}
                      autoComplete='new-password'
                      placeholder={
                        configured && !clearWebhook
                          ? t('Leave blank to keep the configured Webhook')
                          : 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...'
                      }
                      value={field.value}
                      onChange={(event) => {
                        field.onChange(event.target.value)
                        if (event.target.value) {
                          form.setValue('clear_webhook', false, {
                            shouldDirty: true,
                          })
                        }
                      }}
                    />
                    <InputGroupAddon align='inline-end'>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <InputGroupButton
                              size='icon-xs'
                              onClick={() => setShowWebhook((value) => !value)}
                              aria-label={
                                showWebhook
                                  ? t('Hide Webhook')
                                  : t('Show Webhook')
                              }
                            >
                              {showWebhook ? <EyeOff /> : <Eye />}
                            </InputGroupButton>
                          }
                        />
                        <TooltipContent>
                          {showWebhook ? t('Hide Webhook') : t('Show Webhook')}
                        </TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormDescription>
                  {t('The complete address is stored only on the server.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='environment'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Environment name')}</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput {...field} maxLength={64} />
                  </InputGroup>
                </FormControl>
                <FormDescription>
                  {t('Shown in every alert message.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {configured && !webhookValue ? (
            <div data-settings-form-span='full'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() =>
                  form.setValue('clear_webhook', !clearWebhook, {
                    shouldDirty: true,
                  })
                }
              >
                <Trash2 data-icon='inline-start' />
                {clearWebhook
                  ? t('Keep configured Webhook')
                  : t('Clear configured Webhook')}
              </Button>
            </div>
          ) : null}

          <SettingsControlGroup>
            <div>
              <h3 className='text-sm font-semibold'>{t('Detection policy')}</h3>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t(
                  'Only enabled channels are checked. A notification is sent after the failure threshold is reached.'
                )}
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='check_interval_minutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Check interval')}</FormLabel>
                    <Select
                      items={[
                        { value: '1', label: t('Every minute') },
                        { value: '2', label: t('Every 2 minutes') },
                        { value: '5', label: t('Every 5 minutes') },
                        { value: '10', label: t('Every 10 minutes') },
                      ]}
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectGroup>
                          <SelectItem value='1'>{t('Every minute')}</SelectItem>
                          <SelectItem value='2'>
                            {t('Every 2 minutes')}
                          </SelectItem>
                          <SelectItem value='5'>
                            {t('Every 5 minutes')}
                          </SelectItem>
                          <SelectItem value='10'>
                            {t('Every 10 minutes')}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='failure_threshold'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Consecutive failures')}</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          type='number'
                          min={2}
                          max={10}
                          step={1}
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                      </InputGroup>
                    </FormControl>
                    <FormDescription>
                      {t('Allowed range: 2 to 10 checks.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='recovery_enabled'
              render={({ field }) => (
                <SettingsSwitchItem className='border-t pt-4'>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Send recovery notifications')}</FormLabel>
                    <FormDescription>
                      {t('Notify again when an unavailable channel recovers.')}
                    </FormDescription>
                  </SettingsSwitchContent>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!alertsEnabled}
                    />
                  </FormControl>
                </SettingsSwitchItem>
              )}
            />
          </SettingsControlGroup>
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
