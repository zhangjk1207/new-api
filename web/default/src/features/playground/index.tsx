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
import { BotIcon, MessageSquareIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { deleteAgentSession } from './api'
import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundInput } from './components/input/playground-input'
import { STORAGE_KEYS } from './constants'
import {
  useChatHandler,
  usePlaygroundConversation,
  usePlaygroundOptions,
  usePlaygroundState,
} from './hooks'
import type { PlaygroundMode } from './types'

function createAgentSessionId(): string {
  return crypto.randomUUID()
}

function getInitialMode(): PlaygroundMode {
  return localStorage.getItem(STORAGE_KEYS.MODE) === 'agent' ? 'agent' : 'chat'
}

export function Playground() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<PlaygroundMode>(getInitialMode)
  const [agentSessionId, setAgentSessionId] = useState(createAgentSessionId)
  const {
    config,
    parameterEnabled,
    messages,
    isLoadingMessages,
    models,
    groups,
    updateMessages,
    setModels,
    setGroups,
    updateConfig,
    updateParameterEnabled,
    clearMessages,
  } = usePlaygroundState()

  const { sendChat, stopGeneration, isGenerating } = useChatHandler({
    config,
    parameterEnabled,
    mode,
    agentSessionId,
    onMessageUpdate: updateMessages,
  })

  const {
    editingMessageKey,
    handleSendMessage,
    handleRegenerateMessage,
    handleEditMessage,
    handleEditOpenChange,
    applyEdit,
    handleDeleteMessage,
  } = usePlaygroundConversation({
    messages,
    updateMessages,
    sendChat,
  })

  const handleClearMessages = () => {
    handleEditOpenChange(false)
    clearMessages()
    if (mode === 'agent') {
      void deleteAgentSession(agentSessionId)
      setAgentSessionId(createAgentSessionId())
    }
  }

  const handleModeChange = (value: string | number) => {
    if (value !== 'chat' && value !== 'agent') return

    stopGeneration()
    handleEditOpenChange(false)
    clearMessages()
    if (mode === 'agent') void deleteAgentSession(agentSessionId)

    localStorage.setItem(STORAGE_KEYS.MODE, value)
    setMode(value)
    setAgentSessionId(createAgentSessionId())
  }

  const { isLoadingModels } = usePlaygroundOptions({
    currentGroup: config.group,
    currentModel: config.model,
    setGroups,
    setModels,
    updateConfig,
  })

  return (
    <div className='relative flex size-full min-h-0 flex-col overflow-hidden'>
      {/* Full-width scroll container: scrolling works even over side whitespace */}
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <PlaygroundChat
          messages={messages}
          isLoadingMessages={isLoadingMessages}
          onRegenerateMessage={handleRegenerateMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onSelectPrompt={handleSendMessage}
          isGenerating={isGenerating}
          editingKey={editingMessageKey}
          onCancelEdit={handleEditOpenChange}
          onSaveEdit={(newContent) => applyEdit(newContent, false)}
          onSaveEditAndSubmit={(newContent) => applyEdit(newContent, true)}
        />
      </div>

      {/* Input area: center content and constrain to the same container width */}
      <div className='mx-auto grid w-full max-w-4xl gap-2'>
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className='mx-1 h-9'>
            <TabsTrigger value='chat' className='gap-1.5 px-3'>
              <MessageSquareIcon aria-hidden='true' />
              {t('Model chat')}
            </TabsTrigger>
            <TabsTrigger value='agent' className='gap-1.5 px-3'>
              <BotIcon aria-hidden='true' />
              {t('Platform assistant')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <PlaygroundInput
          agentMode={mode === 'agent'}
          config={config}
          disabled={isGenerating}
          groups={groups}
          groupValue={config.group}
          isGenerating={isGenerating}
          isModelLoading={isLoadingModels}
          modelValue={config.model}
          models={models}
          onGroupChange={(value) => updateConfig('group', value)}
          onConfigChange={updateConfig}
          onClearMessages={handleClearMessages}
          onModelChange={(value) => updateConfig('model', value)}
          onParameterEnabledChange={updateParameterEnabled}
          onStop={stopGeneration}
          onSubmit={handleSendMessage}
          parameterEnabled={parameterEnabled}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  )
}
