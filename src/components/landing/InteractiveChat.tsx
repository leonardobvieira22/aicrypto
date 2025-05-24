"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  Mic, 
  MicOff, 
  MoreVertical, 
  Minimize2, 
  Maximize2, 
  Volume2, 
  Settings,
  Zap,
  TrendingUp,
  Brain,
  Search,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from "lucide-react"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isTyping?: boolean
  reactions?: ('like' | 'dislike')[]
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  query: string
}

export function InteractiveChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! 👋 Sou o **AI Crypto**, seu assistente especializado em trading de criptomoedas. Como posso ajudá-lo hoje?\n\nPosso ajudar com:\n• 📈 Análise de mercado\n• 💰 Estratégias de trading\n• 📊 Indicadores técnicos\n• 🔍 Pesquisa de ativos',
      role: 'assistant',
      timestamp: new Date(),
      reactions: []
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions: QuickAction[] = [
    {
      id: '1',
      label: 'Análise Bitcoin',
      icon: <TrendingUp className="w-4 h-4" />,
      query: 'Faça uma análise técnica do Bitcoin hoje'
    },
    {
      id: '2',
      label: 'Estratégias DCA',
      icon: <Brain className="w-4 h-4" />,
      query: 'Explique estratégias de Dollar Cost Averaging'
    },
    {
      id: '3',
      label: 'Top Altcoins',
      icon: <Search className="w-4 h-4" />,
      query: 'Quais são as melhores altcoins para investir?'
    },
    {
      id: '4',
      label: 'Stop Loss',
      icon: <Zap className="w-4 h-4" />,
      query: 'Como configurar stop loss efetivo?'
    }
  ]

  const scrollToBottomOfChat = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    // Apenas fazer scroll dentro do chat quando mensagens mudarem
    // Não fazer scroll da página toda
    scrollToBottomOfChat()
  }, [messages, scrollToBottomOfChat])

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />')
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      role: 'user',
      timestamp: new Date(),
      reactions: []
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowSuggestions(false)

    // Simular mensagem de digitação
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const response = await fetch('/api/grok-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          context: 'trading de criptomoedas'
        }),
      })

      if (!response.ok) {
        throw new Error('Falha na comunicação com a API')
      }

      const data = await response.json()

      // Remover mensagem de digitação
      setMessages(prev => prev.filter(msg => !msg.isTyping))

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Desculpe, não consegui processar sua solicitação no momento.',
        role: 'assistant',
        timestamp: new Date(),
        reactions: []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setMessages(prev => prev.filter(msg => !msg.isTyping))
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro na conexão. Tente novamente em alguns instantes.',
        role: 'assistant',
        timestamp: new Date(),
        reactions: []
      }
      setMessages(prev => [...prev, errorMessage])
      setConnectionStatus('offline')
      setTimeout(() => setConnectionStatus('online'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.query)
    // Focar no input após enviar mensagem via ação rápida
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const focusOnChat = useCallback(() => {
    // Focar no input do chat para melhor experiência do usuário
    inputRef.current?.focus()
  }, [])

  // Focar no chat quando o componente monta (útil para quando a página é recarregada)
  useEffect(() => {
    const timer = setTimeout(() => {
      focusOnChat()
    }, 500) // Pequeno delay para garantir que a animação terminou
    
    return () => clearTimeout(timer)
  }, [focusOnChat])

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const reactToMessage = (messageId: string, reaction: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => {
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
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleVoice = () => {
    setIsListening(!isListening)
    // Implementar reconhecimento de voz aqui
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 z-50 lg:relative lg:bottom-auto lg:right-auto lg:w-full"
      >
        <div className="bg-gradient-to-r from-[#5957D5] to-[#7C3AED] text-white p-4 rounded-xl shadow-2xl backdrop-blur-lg border border-white/20 cursor-pointer"
             onClick={() => setIsMinimized(false)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">AI Crypto Chat</h3>
              <p className="text-xs text-purple-100">Clique para expandir</p>
            </div>
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      id="chat-interativo"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full max-w-4xl mx-auto h-[600px] lg:h-[700px] overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-lg border border-white/20"
    >
      {/* Header Premium */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5957D5] via-[#7C3AED] to-[#8B5CF6] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="relative flex items-center justify-between p-4 lg:p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Brain className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                connectionStatus === 'online' ? 'bg-green-400' : 
                connectionStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
              } ${connectionStatus === 'online' ? 'animate-pulse' : ''}`} />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg lg:text-xl">AI Crypto Assistant</h3>
              <div className="flex items-center gap-2 text-xs lg:text-sm text-purple-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>
                    {connectionStatus === 'online' ? 'Online' : 
                     connectionStatus === 'offline' ? 'Reconectando...' : 'Conectando...'}
                  </span>
                </div>
                <span>•</span>
                <span>IA Especializada</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
              title={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20 lg:hidden"
              title="Minimizar chat"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 h-[calc(100%-180px)] lg:h-[calc(100%-200px)] overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`group relative max-w-[85%] lg:max-w-[75%] ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                {/* Avatar e Info */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 bg-gradient-to-r from-[#5957D5] to-[#7C3AED] rounded-full flex items-center justify-center shadow-lg">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">AI Crypto</span>
                      <span className="text-gray-400">•</span>
                      <span>{message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )}

                {/* Bolha da Mensagem */}
                <div
                  className={`relative rounded-2xl px-4 py-3 lg:px-5 lg:py-4 shadow-lg backdrop-blur-sm border transition-all duration-200 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#5957D5] to-[#7C3AED] text-white border-purple-200/30 ml-auto'
                      : 'bg-white/80 text-gray-800 border-gray-200/50 hover:bg-white/90'
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#5957D5] rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[#5957D5] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-[#5957D5] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-sm text-gray-500 ml-2">AI está digitando...</span>
                    </div>
                  ) : (
                    <>
                      <div 
                        className="text-sm lg:text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      
                      {/* Timestamp para usuário */}
                      {message.role === 'user' && (
                        <div className="text-xs text-purple-100 mt-2 text-right">
                          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Ações da Mensagem */}
                  {!message.isTyping && (
                    <div className={`absolute top-2 ${message.role === 'user' ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                      <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-lg p-1">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="p-1 rounded hover:bg-white/20 transition-colors"
                          title="Copiar mensagem"
                        >
                          <Copy className="w-3 h-3 text-white" />
                        </button>
                        
                        {message.role === 'assistant' && (
                          <>
                            <button
                              onClick={() => reactToMessage(message.id, 'like')}
                              className={`p-1 rounded transition-colors ${
                                message.reactions?.includes('like') 
                                  ? 'bg-green-500/30 text-green-200' 
                                  : 'hover:bg-white/20 text-white'
                              }`}
                              title="Útil"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => reactToMessage(message.id, 'dislike')}
                              className={`p-1 rounded transition-colors ${
                                message.reactions?.includes('dislike') 
                                  ? 'bg-red-500/30 text-red-200' 
                                  : 'hover:bg-white/20 text-white'
                              }`}
                              title="Não útil"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Sugestões Rápidas */}
        {showSuggestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6"
          >
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-3 p-3 lg:p-4 bg-white/60 hover:bg-white/80 border border-gray-200/50 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[#5957D5] to-[#7C3AED] rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 text-left">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Área Premium */}
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 bg-white/80 backdrop-blur-lg border-t border-gray-200/50">
        <div className="flex items-end gap-2 lg:gap-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre crypto trading..."
              className="w-full px-3 py-3 lg:px-5 lg:py-4 text-sm lg:text-base text-gray-800 bg-white/90 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5957D5]/50 focus:border-[#5957D5]/50 transition-all duration-200 shadow-sm placeholder:text-gray-400 pr-12 lg:pr-16"
              disabled={isLoading}
              maxLength={1000}
            />
            
            {/* Contador de caracteres - apenas desktop */}
            <div className="hidden lg:block absolute bottom-1 right-3 text-xs text-gray-400">
              {input.length}/1000
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Voz */}
            <button
              onClick={toggleVoice}
              disabled={isLoading}
              className={`p-2.5 lg:p-4 rounded-xl transition-all duration-200 border ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-white/90 hover:bg-gray-50 text-gray-600 border-gray-200/50 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
              title={isListening ? 'Parar gravação' : 'Gravar áudio'}
            >
              {isListening ? <MicOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Mic className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>

            {/* Botão de Envio */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 lg:p-4 bg-gradient-to-r from-[#5957D5] to-[#7C3AED] hover:from-[#4F4EC0] hover:to-[#6D28D9] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 border border-purple-200/30"
              title="Enviar mensagem"
            >
              {isLoading ? (
                <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Status Bar Otimizado */}
        <div className="flex items-center justify-between mt-2 lg:mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-2 lg:gap-4">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="hidden sm:inline">
                {connectionStatus === 'online' ? 'Conectado' : 'Desconectado'}
              </span>
              <span className="sm:hidden">
                {connectionStatus === 'online' ? '●' : '○'}
              </span>
            </span>
            <span className="hidden md:inline">Pressione Enter para enviar</span>
          </div>
          
          <div className="flex items-center gap-1 lg:gap-2">
            <span className="text-[10px] lg:text-xs">AI Crypto</span>
            <Zap className="w-3 h-3 text-yellow-500" />
          </div>
        </div>
      </div>
    </motion.div>
  )
} 