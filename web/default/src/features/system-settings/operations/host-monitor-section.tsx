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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Pencil, PlugZap, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  createHostMonitor,
  deleteHostMonitor,
  getHostMonitors,
  testHostMonitor,
  updateHostMonitor,
  type HostMonitor,
  type HostMonitorInput,
} from '@/features/host-monitoring/api'

import { SettingsSection } from '../components/settings-section'

const emptyHost = (): HostMonitorInput => ({
  name: '',
  address: '',
  port: 22,
  username: '',
  private_key: '',
  enabled: true,
})

export function HostMonitorSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['host-monitors'],
    queryFn: getHostMonitors,
  })
  const [editing, setEditing] = useState<HostMonitor | null>(null)
  const [form, setForm] = useState<HostMonitorInput>(emptyHost)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<HostMonitor | null>(null)
  const [saving, setSaving] = useState(false)
  const [testingID, setTestingID] = useState<number | null>(null)

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['host-monitors'] })
    await queryClient.invalidateQueries({ queryKey: ['host-monitoring'] })
  }
  const openCreate = () => {
    setEditing(null)
    setForm(emptyHost())
    setDialogOpen(true)
  }
  const openEdit = (host: HostMonitor) => {
    setEditing(host)
    setForm({
      name: host.name,
      address: host.address,
      port: host.port,
      username: host.username,
      private_key: '',
      enabled: host.enabled,
    })
    setDialogOpen(true)
  }
  const save = async () => {
    if (!editing && !form.private_key?.trim()) {
      toast.error(t('SSH private key is required'))
      return
    }
    setSaving(true)
    try {
      if (editing) await updateHostMonitor(editing.id, form)
      else await createHostMonitor(form)
      await refresh()
      setDialogOpen(false)
      toast.success(t('Saved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Save failed'))
    } finally {
      setSaving(false)
    }
  }
  const testConnection = async (host: HostMonitor) => {
    setTestingID(host.id)
    try {
      await testHostMonitor(host.id)
      toast.success(t('Connection successful'))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('Connection failed')
      )
    } finally {
      setTestingID(null)
    }
  }
  const remove = async () => {
    if (!deleteTarget) return
    try {
      await deleteHostMonitor(deleteTarget.id)
      await refresh()
      toast.success(t('Deleted'))
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Delete failed'))
    }
  }

  return (
    <SettingsSection title={t('Host Settings')}>
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-muted-foreground text-sm'>
            {t(
              'Configure Linux hosts for CPU, memory, and NVIDIA GPU monitoring.'
            )}
          </p>
          <Button type='button' onClick={openCreate}>
            <Plus className='size-4' />
            {t('Add host')}
          </Button>
        </div>
        <div className='overflow-hidden rounded-lg border'>
          <Table className='min-w-[800px]'>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='px-4'>{t('Host')}</TableHead>
                <TableHead>{t('SSH')}</TableHead>
                <TableHead>{t('Private Key')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead className='pr-4 text-right'>
                  {t('Actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.map((host) => (
                <TableRow key={host.id}>
                  <TableCell className='px-4'>
                    <p className='font-medium'>{host.name}</p>
                    <p className='text-muted-foreground font-mono text-xs'>
                      {host.address}
                    </p>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {host.username}:{host.port}
                  </TableCell>
                  <TableCell>
                    {host.private_key_configured ? (
                      <span className='inline-flex items-center gap-1 text-xs text-emerald-600'>
                        <CheckCircle2 className='size-3.5' />
                        {t('Configured')}
                      </span>
                    ) : (
                      <span className='text-muted-foreground text-xs'>
                        {t('Not configured')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {host.enabled ? t('Enabled') : t('Disabled')}
                  </TableCell>
                  <TableCell className='pr-4 text-right'>
                    <div className='flex justify-end gap-1'>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              onClick={() => testConnection(host)}
                              disabled={testingID === host.id}
                              aria-label={t('Test Connection')}
                            >
                              <PlugZap className='size-4' />
                            </Button>
                          }
                        />
                        <TooltipContent>{t('Test Connection')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              onClick={() => openEdit(host)}
                              aria-label={t('Edit')}
                            >
                              <Pencil className='size-4' />
                            </Button>
                          }
                        />
                        <TooltipContent>{t('Edit')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              onClick={() => setDeleteTarget(host)}
                              aria-label={t('Delete')}
                            >
                              <Trash2 className='text-destructive size-4' />
                            </Button>
                          }
                        />
                        <TooltipContent>{t('Delete')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!query.isLoading && query.data?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-muted-foreground h-28 text-center'
                  >
                    {t('No hosts configured')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-xl'>
          <DialogHeader>
            <DialogTitle>
              {editing ? t('Edit host') : t('Add host')}
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-1 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='host-name'>{t('Host name')}</Label>
              <Input
                id='host-name'
                value={form.name}
                onChange={(event) =>
                  setForm((value) => ({ ...value, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='host-address'>{t('Host address')}</Label>
              <Input
                id='host-address'
                value={form.address}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    address: event.target.value,
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='host-port'>{t('SSH port')}</Label>
              <Input
                id='host-port'
                type='number'
                min={1}
                max={65535}
                value={form.port}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    port: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='host-user'>{t('SSH user')}</Label>
              <Input
                id='host-user'
                value={form.username}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    username: event.target.value,
                  }))
                }
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='host-key'>{t('SSH private key')}</Label>
              <Textarea
                id='host-key'
                value={form.private_key}
                placeholder={
                  editing
                    ? t('Leave blank to keep the existing private key')
                    : ''
                }
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    private_key: event.target.value,
                  }))
                }
              />
            </div>
            <div className='flex items-center justify-between gap-3 sm:col-span-2'>
              <div>
                <Label>{t('Enabled')}</Label>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('Disabled hosts are not collected.')}
                </p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(enabled) =>
                  setForm((value) => ({ ...value, enabled }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDialogOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type='button' onClick={save} disabled={saving}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete host')}</DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground text-sm'>
            {t('Delete this host and its monitoring history?')}
          </p>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteTarget(null)}
            >
              {t('Cancel')}
            </Button>
            <Button type='button' variant='destructive' onClick={remove}>
              {t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  )
}
