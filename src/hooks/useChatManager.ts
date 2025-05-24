import { useState, useRef, useEffect, useCallback } from 'react'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isTyping?: boolean
  reactions?: ('like' | 'dislike')[]
  metadata?: {
    tokens?: number
    model?: string
    confidence?: number
  }
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  isConnected: boolean
  connectionStatus: 'online' | 'offline' | 'reconnecting'
  error: string | null
}

export function useChatManager() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        content: 'Olá! 👋 Sou o **AI Crypto**, seu assistente especializado em trading de criptomoedas. Como posso ajudá-lo hoje?\n\nPosso ajudar com:\n• 📈 Análise de mercado\n• 💰 Estratégias de trading\n• 📊 Indicadores técnicos\n• 🔍 Pesquisa de ativos',
        role: 'assistant',
        timestamp: new Date(),
        reactions: []
      }
    ],
    isLoading: false,
    isConnected: true,
    connectionStatus: 'online',
    error: null
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout>()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatState.messages, scrollToBottom])

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }))

    return newMessage.id
  }, [])

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }))
  }, [])

  const removeMessage = useCallback((messageId: string) => {
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId)
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setChatState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setConnectionStatus = useCallback((status: 'online' | 'offline' | 'reconnecting') => {
    setChatState(prev => ({ 
      ...prev, 
      connectionStatus: status,
      isConnected: status === 'online'
    }))

    if (status === 'offline') {
      // Tentar reconectar automaticamente
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        setConnectionStatus('online')
      }, 3000)
    }
  }, [])

  const setError = useCallback((error: string | null) => {
    setChatState(prev => ({ ...prev, error }))
  }, [])

  const clearMessages = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [prev.messages[0]] // Manter apenas a mensagem inicial
    }))
  }, [])

  const reactToMessage = useCallback((messageId: string, reaction: 'like' | 'dislike') => {
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || []
          const hasReaction = reactions.includes(reaction)
          return {
            ...msg,
            reactions: hasReaction 
              ? reactions.filter(r => r !== reaction)
              : [...reactions.filter(r => r !== reaction), reaction]
          }
        }
        return msg
      })
    }))
  }, [])

  const sendMessage = useCallback(async (content: string, context = 'trading de criptomoedas') => {
    if (!content.trim() || chatState.isLoading) return null

    // Adicionar mensagem do usuário
    const userMessageId = addMessage({
      content: content.trim(),
      role: 'user',
      reactions: []
    })

    setLoading(true)
    setError(null)

    // Adicionar indicador de digitação
    const typingMessageId = addMessage({
      content: '',
      role: 'assistant',
      isTyping: true
    })

    try {
      const response = await fetch('/api/grok-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          context,
          conversation: chatState.messages.slice(-10) // Últimas 10 mensagens para contexto
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Remover indicador de digitação
      removeMessage(typingMessageId)

      // Adicionar resposta da IA
      const assistantMessageId = addMessage({
        content: data.response || 'Desculpe, não consegui processar sua solicitação no momento.',
        role: 'assistant',
        reactions: [],
        metadata: {
          tokens: data.tokens,
          model: data.model,
          confidence: data.confidence
        }
      })

      setConnectionStatus('online')
      return assistantMessageId

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      // Remover indicador de digitação
      removeMessage(typingMessageId)
      
      // Adicionar mensagem de erro
      addMessage({
        content: 'Desculpe, ocorreu um erro na conexão. Tente novamente em alguns instantes.',
        role: 'assistant',
        reactions: []
      })

      setConnectionStatus('offline')
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      return null

    } finally {
      setLoading(false)
    }
  }, [chatState.isLoading, chatState.messages, addMessage, setLoading, setError, setConnectionStatus, removeMessage])

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...chatState,
    messagesEndRef,
    addMessage,
    updateMessage,
    removeMessage,
    sendMessage,
    reactToMessage,
    clearMessages,
    setConnectionStatus,
    setError,
    setLoading
  }
} 