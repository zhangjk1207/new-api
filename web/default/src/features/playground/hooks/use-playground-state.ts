import { nanoid } from 'nanoid'
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
import { useCallback, useEffect, useRef, useState } from 'react'

import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../constants'
import {
  saveConfig,
  saveParameterEnabled,
  loadActiveConversationId,
  loadAgentConversations,
  saveActiveConversationId,
  saveAgentConversations,
  applyMessageStateUpdate,
  getInitialParameterEnabled,
  getInitialPlaygroundConfig,
  loadMessages,
  type MessageStateUpdater,
} from '../lib'
import type {
  Message,
  AgentConversation,
  PlaygroundConfig,
  ParameterEnabled,
  ModelOption,
  GroupOption,
} from '../types'

const MESSAGE_SAVE_DEBOUNCE_MS = 500

/**
 * Main state management hook for playground
 */
export function usePlaygroundState() {
  // Load initial state from localStorage
  const [config, setConfig] = useState<PlaygroundConfig>(
    getInitialPlaygroundConfig
  )
  const configRef = useRef(config)
  configRef.current = config

  const [parameterEnabled, setParameterEnabled] = useState<ParameterEnabled>(
    getInitialParameterEnabled
  )

  const [messages, setMessages] = useState<Message[]>([])
  const latestMessagesRef = useRef<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [conversations, setConversations] = useState<AgentConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const conversationsSaveTimerRef = useRef<number | null>(null)
  const latestConversationsRef = useRef<AgentConversation[]>([])
  const activeConversationIdRef = useRef('')
  const hasLoadedConversationsRef = useRef(false)

  const [models, setModels] = useState<ModelOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])

  const persistConversations = useCallback(
    (conversationsToSave: AgentConversation[]) => {
      latestConversationsRef.current = conversationsToSave
      if (!hasLoadedConversationsRef.current) {
        return
      }
      if (conversationsSaveTimerRef.current !== null) {
        window.clearTimeout(conversationsSaveTimerRef.current)
      }
      conversationsSaveTimerRef.current = window.setTimeout(() => {
        conversationsSaveTimerRef.current = null
        saveAgentConversations(latestConversationsRef.current)
      }, MESSAGE_SAVE_DEBOUNCE_MS)
    },
    []
  )

  const activateConversation = useCallback(
    (conversation: AgentConversation) => {
      activeConversationIdRef.current = conversation.id
      setActiveConversationId(conversation.id)
      saveActiveConversationId(conversation.id)
      latestMessagesRef.current = conversation.messages
      setMessages(conversation.messages)
      setConfig((previous) => {
        const updated = {
          ...previous,
          model: conversation.model,
          group: conversation.group,
        }
        saveConfig(updated)
        return updated
      })
    },
    []
  )

  const buildConversation = useCallback(
    (messagesToUse: Message[] = []): AgentConversation => {
      const now = Date.now()
      return {
        id: nanoid(),
        title: '',
        messages: messagesToUse,
        model: configRef.current.model,
        group: configRef.current.group,
        createdAt: now,
        updatedAt: now,
      }
    },
    []
  )

  const replaceConversations = useCallback(
    (next: AgentConversation[]) => {
      setConversations(next)
      persistConversations(next)
    },
    [persistConversations]
  )

  const createConversation = useCallback(() => {
    const conversation = buildConversation()
    const next = [conversation, ...latestConversationsRef.current]
    replaceConversations(next)
    activateConversation(conversation)
    return conversation.id
  }, [activateConversation, buildConversation, replaceConversations])

  const selectConversation = useCallback(
    (id: string) => {
      const conversation = latestConversationsRef.current.find(
        (item) => item.id === id
      )
      if (conversation) activateConversation(conversation)
    },
    [activateConversation]
  )

  const deleteConversation = useCallback(
    (id: string) => {
      const remaining = latestConversationsRef.current.filter(
        (conversation) => conversation.id !== id
      )
      if (id !== activeConversationIdRef.current) {
        replaceConversations(remaining)
        return
      }

      const nextConversation = remaining[0] ?? buildConversation()
      const next = remaining.length > 0 ? remaining : [nextConversation]
      replaceConversations(next)
      activateConversation(nextConversation)
    },
    [activateConversation, buildConversation, replaceConversations]
  )

  useEffect(() => {
    let cancelled = false

    window.setTimeout(() => {
      let loaded = loadAgentConversations()
      if (loaded.length === 0) {
        const legacyMessages = loadMessages() ?? []
        loaded = [buildConversation(legacyMessages)]
      }
      if (cancelled) {
        return
      }

      latestConversationsRef.current = loaded
      hasLoadedConversationsRef.current = true
      setConversations(loaded)
      const savedActiveId = loadActiveConversationId()
      const active =
        loaded.find((conversation) => conversation.id === savedActiveId) ??
        loaded[0]
      activateConversation(active)
      saveAgentConversations(loaded)
      setIsLoadingMessages(false)
    }, 0)

    return () => {
      cancelled = true
    }
  }, [activateConversation, buildConversation])

  useEffect(
    () => () => {
      if (conversationsSaveTimerRef.current !== null) {
        window.clearTimeout(conversationsSaveTimerRef.current)
        saveAgentConversations(latestConversationsRef.current)
      }
    },
    []
  )

  const updateActiveConversation = useCallback(
    (updater: (conversation: AgentConversation) => AgentConversation) => {
      const next = latestConversationsRef.current.map((conversation) =>
        conversation.id === activeConversationIdRef.current
          ? updater(conversation)
          : conversation
      )
      replaceConversations(next)
    },
    [replaceConversations]
  )

  // Update config with automatic save
  const updateConfig = useCallback(
    <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveConfig(updated)
        return updated
      })
      if (key === 'model' || key === 'group') {
        updateActiveConversation((conversation) => ({
          ...conversation,
          [key]: value,
          updatedAt: Date.now(),
        }))
      }
    },
    [updateActiveConversation]
  )

  // Update parameter enabled with automatic save
  const updateParameterEnabled = useCallback(
    (key: keyof ParameterEnabled, value: boolean) => {
      setParameterEnabled((prev) => {
        const updated = { ...prev, [key]: value }
        saveParameterEnabled(updated)
        return updated
      })
    },
    []
  )

  // Update messages and the active conversation with automatic save
  const updateMessages = useCallback(
    (updater: MessageStateUpdater) => {
      const newMessages = applyMessageStateUpdate(
        latestMessagesRef.current,
        updater
      )
      latestMessagesRef.current = newMessages
      setMessages(newMessages)
      const firstUserMessage = newMessages.find(
        (message) => message.from === 'user'
      )
      const title = firstUserMessage?.versions.at(-1)?.content.trim() ?? ''
      updateActiveConversation((conversation) => ({
        ...conversation,
        title: title.slice(0, 48),
        messages: newMessages,
        updatedAt: Date.now(),
      }))
    },
    [updateActiveConversation]
  )

  // Clear messages in the active conversation
  const clearMessages = useCallback(() => {
    updateMessages([])
  }, [updateMessages])

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    saveConfig(DEFAULT_CONFIG)
    saveParameterEnabled(DEFAULT_PARAMETER_ENABLED)
  }, [])

  return {
    // State
    config,
    parameterEnabled,
    messages,
    conversations,
    activeConversationId,
    isLoadingMessages,
    models,
    groups,

    // Setters
    setModels,
    setGroups,

    // Actions
    updateConfig,
    updateParameterEnabled,
    updateMessages,
    clearMessages,
    createConversation,
    selectConversation,
    deleteConversation,
    resetConfig,
  }
}
