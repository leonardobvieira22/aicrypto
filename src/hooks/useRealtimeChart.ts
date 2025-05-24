"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useBinanceWebSocket, type KlineTick } from '@/lib/services/binanceWebSocket'
import { useConnection } from '@/hooks/useConnection'

export interface RealtimeChartOptions {
  symbol: string
  interval: string
  onDataUpdate: (data: KlineTick) => void
  enableAutoReconnect?: boolean
  maxRetries?: number
  retryDelay?: number
  inactivityTimeout?: number
}

export interface RealtimeChartState {
  isConnected: boolean
  isConnecting: boolean
  hasError: boolean
  errorMessage: string | null
  lastUpdateTime: Date | null
  reconnectAttempts: number
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline'
}

// Função auxiliar para verificar se estamos no cliente
const isClient = () => typeof window !== 'undefined'

export function useRealtimeChart(options: RealtimeChartOptions) {
  const {
    symbol,
    interval,
    onDataUpdate,
    enableAutoReconnect = true,
    maxRetries = 5,
    retryDelay = 3000,
    inactivityTimeout = 120000 // 2 minutos
  } = options

  const binanceWebSocket = useBinanceWebSocket()
  const connectionManager = useConnection({
    maxRetries,
    retryDelay,
    heartbeatInterval: 30000,
    enableHeartbeat: true
  })

  const [state, setState] = useState<RealtimeChartState>({
    isConnected: false,
    isConnecting: false,
    hasError: false,
    errorMessage: null,
    lastUpdateTime: null,
    reconnectAttempts: 0,
    connectionQuality: 'offline'
  })

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptRef = useRef(0)

  // Função para limpar timers
  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  // Função para configurar timer de inatividade
  const setupInactivityTimer = useCallback(() => {
    if (!isClient()) return // Não configurar timers no servidor
    
    clearTimers()
    
    inactivityTimerRef.current = setTimeout(() => {
      console.warn(`⚠️ Nenhuma atualização recebida para ${symbol}@${interval} por ${inactivityTimeout / 1000}s`)
      
      setState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: 'Conexão inativa detectada',
        connectionQuality: 'poor'
      }))

      // Tentar reconectar se habilitado
      if (enableAutoReconnect) {
        // Usar setTimeout para evitar dependência circular
        setTimeout(() => {
          reconnectAttemptRef.current++
          
          if (reconnectAttemptRef.current <= maxRetries) {
            const streamName = `${symbol.toLowerCase()}@kline_${interval}`
            binanceWebSocket.unsubscribe(streamName)
            
            setTimeout(() => {
              if (connectionManager.status.isOnline) {
                // Reconectar (lógica simplificada para evitar circular dep)
                setState(prev => ({ ...prev, isConnecting: true }))
              }
            }, retryDelay)
          }
        }, 100)
      }
    }, inactivityTimeout)
  }, [symbol, interval, inactivityTimeout, enableAutoReconnect, clearTimers, maxRetries, retryDelay, binanceWebSocket, connectionManager.status.isOnline])

  // Callback para processar dados recebidos
  const handleDataUpdate = useCallback((data: KlineTick) => {
    const now = new Date()
    
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      hasError: false,
      errorMessage: null,
      lastUpdateTime: now,
      connectionQuality: 'excellent'
    }))

    // Resetar timer de inatividade
    setupInactivityTimer()
    
    // Chamar callback do usuário
    onDataUpdate(data)
  }, [onDataUpdate, setupInactivityTimer])

  // Função para conectar
  const connect = useCallback(() => {
    if (!isClient()) {
      console.warn('⚠️ [REALTIME_CHART] Tentativa de conexão no servidor ignorada')
      return
    }

    if (!connectionManager.status.isOnline) {
      setState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: 'Sem conectividade com a internet',
        connectionQuality: 'offline'
      }))
      return
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      hasError: false,
      errorMessage: null
    }))

    const streamName = `${symbol.toLowerCase()}@kline_${interval}`

    try {
      binanceWebSocket.subscribeKline({
        symbols: [symbol],
        interval,
        maxRetries,
        retryDelay,
        heartbeatInterval: 30000,
        enableAutoReconnect,
        callbacks: {
          onKline: handleDataUpdate,
          onOpen: () => {
            console.log(`✅ WebSocket conectado: ${streamName}`)
            
            setState(prev => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              hasError: false,
              errorMessage: null,
              reconnectAttempts: 0,
              connectionQuality: 'good'
            }))

            setupInactivityTimer()
            reconnectAttemptRef.current = 0
          },
          onClose: (event) => {
            console.log(`🔌 WebSocket fechado: ${streamName}`)
            
            setState(prev => ({
              ...prev,
              isConnected: false,
              connectionQuality: 'offline'
            }))

            clearTimers()

            // Só tentar reconectar se não foi fechamento manual
            if (event.code !== 1000 && enableAutoReconnect) {
              setTimeout(() => reconnect(), retryDelay)
            }
          },
          onError: (event) => {
            console.error(`💥 Erro WebSocket: ${streamName}`, event)
            
            setState(prev => ({
              ...prev,
              isConnected: false,
              isConnecting: false,
              hasError: true,
              errorMessage: 'Erro na conexão WebSocket',
              connectionQuality: 'offline'
            }))

            clearTimers()

            if (enableAutoReconnect) {
              setTimeout(() => reconnect(), retryDelay)
            }
          },
          onReconnect: () => {
            console.log(`🔄 Reconectando WebSocket: ${streamName}`)
            
            setState(prev => ({
              ...prev,
              isConnecting: true,
              errorMessage: 'Reconectando...',
              reconnectAttempts: prev.reconnectAttempts + 1
            }))
          },
          onMaxRetriesReached: () => {
            console.error(`💥 Máximo de tentativas atingido: ${streamName}`)
            
            setState(prev => ({
              ...prev,
              isConnected: false,
              isConnecting: false,
              hasError: true,
              errorMessage: 'Falha na reconexão automática',
              connectionQuality: 'offline'
            }))

            clearTimers()
          }
        }
      })
    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error)
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        hasError: true,
        errorMessage: 'Falha ao inicializar conexão',
        connectionQuality: 'offline'
      }))
    }
  }, [
    symbol,
    interval,
    binanceWebSocket,
    connectionManager.status.isOnline,
    maxRetries,
    retryDelay,
    enableAutoReconnect,
    handleDataUpdate,
    setupInactivityTimer,
    clearTimers
  ])

  // Função para desconectar
  const disconnect = useCallback(() => {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`
    binanceWebSocket.unsubscribe(streamName)
    clearTimers()
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      hasError: false,
      errorMessage: null,
      connectionQuality: 'offline'
    }))
  }, [symbol, interval, binanceWebSocket, clearTimers])

  // Função para reconectar
  const reconnect = useCallback(() => {
    reconnectAttemptRef.current++
    
    if (reconnectAttemptRef.current > maxRetries) {
      setState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: 'Máximo de tentativas de reconexão atingido',
        connectionQuality: 'offline'
      }))
      return
    }

    disconnect()
    
    // Aguardar um pouco antes de reconectar
    setTimeout(() => {
      connect()
    }, Math.min(retryDelay * reconnectAttemptRef.current, 30000))
  }, [maxRetries, disconnect, connect, retryDelay])

  // Conectar automaticamente quando o hook é inicializado
  useEffect(() => {
    if (isClient() && connectionManager.status.isOnline) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [symbol, interval]) // Reconectar quando símbolo ou intervalo mudam

  // Monitorar mudanças na conectividade
  useEffect(() => {
    if (!isClient()) return

    if (connectionManager.status.isOnline && !state.isConnected && !state.isConnecting) {
      connect()
    } else if (!connectionManager.status.isOnline && state.isConnected) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        hasError: true,
        errorMessage: 'Perda de conectividade',
        connectionQuality: 'offline'
      }))
    }
  }, [connectionManager.status.isOnline, state.isConnected, state.isConnecting, connect])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    isRetrying: state.reconnectAttempts > 0 && state.isConnecting,
    canRetry: reconnectAttemptRef.current < maxRetries,
    internetConnected: connectionManager.status.isOnline,
    globalConnectionStatus: connectionManager.status
  }
} 