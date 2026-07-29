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
import { Bot, History, MessageSquareText, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toIntlLocale } from '@/i18n/languages'
import { cn } from '@/lib/utils'

import type { AgentConversation } from '../types'

type AgentHistorySheetProps = {
  activeConversationId: string
  conversations: AgentConversation[]
  disabled?: boolean
  onCreate: () => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}

export function AgentHistorySheet({
  activeConversationId,
  conversations,
  disabled,
  onCreate,
  onDelete,
  onSelect,
}: AgentHistorySheetProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div className='border-border/70 flex h-12 shrink-0 items-center justify-between border-b px-4'>
      <div className='flex min-w-0 items-center gap-2'>
        <Bot className='text-primary size-5' aria-hidden='true' />
        <h1 className='truncate text-base font-semibold'>
          {t('Operations Agent')}
        </h1>
      </div>

      <TooltipProvider delay={100}>
        <div className='flex items-center gap-1'>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  disabled={disabled}
                  onClick={onCreate}
                />
              }
            >
              <Plus aria-hidden='true' />
              <span className='sr-only'>{t('New conversation')}</span>
            </TooltipTrigger>
            <TooltipContent>{t('New conversation')}</TooltipContent>
          </Tooltip>

          <Sheet open={open} onOpenChange={setOpen}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    disabled={disabled}
                    onClick={() => setOpen(true)}
                  />
                }
              >
                <History aria-hidden='true' />
                <span className='sr-only'>{t('Conversation history')}</span>
              </TooltipTrigger>
              <TooltipContent>{t('Conversation history')}</TooltipContent>
            </Tooltip>

            <SheetContent className='w-[88vw] sm:max-w-md'>
              <SheetHeader className='border-b pr-12'>
                <SheetTitle>{t('Conversation history')}</SheetTitle>
                <SheetDescription>
                  {t('Conversations are saved in this browser')}
                </SheetDescription>
              </SheetHeader>

              <div className='min-h-0 flex-1 overflow-y-auto px-2 pb-4'>
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-2 py-1',
                      conversation.id === activeConversationId && 'bg-muted'
                    )}
                  >
                    <button
                      type='button'
                      className='focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-2 text-left outline-none focus-visible:ring-2'
                      onClick={() => {
                        onSelect(conversation.id)
                        setOpen(false)
                      }}
                    >
                      <MessageSquareText
                        className='text-muted-foreground size-4 shrink-0'
                        aria-hidden='true'
                      />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-medium'>
                          {conversation.title || t('New conversation')}
                        </span>
                        <span className='text-muted-foreground block truncate text-xs'>
                          {conversation.model} ·{' '}
                          {dateFormatter.format(conversation.updatedAt)}
                        </span>
                      </span>
                    </button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      className='text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                      onClick={() => onDelete(conversation.id)}
                      aria-label={t('Delete conversation')}
                    >
                      <Trash2 aria-hidden='true' />
                    </Button>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </TooltipProvider>
    </div>
  )
}
