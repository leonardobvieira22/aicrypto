"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ConnectionStatus {
  isOnline: boolean
  isConnecting: boolean
  hasError: boolean
  errorMessage: string | null
  lastConnected: Date | null
  reconnectAttempts: number
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline'
}

export interface UseConnectionOptions {
  maxRetries?: number
  retryDelay?: number
  heartbeatInterval?: number
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  enableHeartbeat?: boolean
}

// Função auxiliar para verificar se estamos no cliente
const isClient = () => typeof window !== 'undefined'

// Função auxiliar para obter o status online de forma segura
const getNavigatorOnline = () => {
  return isClient() ? navigator.onLine : false
}

export function useConnection(options: UseConnectionOptions = {}) {
  const {
    maxRetries = 5,
    retryDelay = 3000,
    heartbeatInterval = 30000,
    onConnect,
    onDisconnect,
    onError,
    enableHeartbeat = true
  } = options

  // Estado inicial seguro para SSR
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: false, // Valor padrão seguro para SSR
    isConnecting: false,
    hasError: false,
    errorMessage: null,
    lastConnected: null,
    reconnectAttempts: 0,
    connectionQuality: 'offline' // Valor padrão seguro para SSR
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPingTimeRef = useRef<number>(Date.now())
  const isManuallyDisconnectedRef = useRef(false)

  // Inicializar estado correto no cliente após montagem
  useEffect(() => {
    if (isClient()) {
      const initialOnlineStatus = getNavigatorOnline()
      setStatus(prev => ({
        ...prev,
        isOnline: initialOnlineStatus,
        connectionQuality: initialOnlineStatus ? 'good' : 'offline'
      }))
    }
  }, [])

  // Função para testar a qualidade da conexão
  const testConnectionQuality = useCallback(async (): Promise<'excellent' | 'good' | 'poor' | 'offline'> => {
    if (!isClient() || !getNavigatorOnline()) return 'offline'

    try {
      const startTime = performance.now()
      const response = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) return 'poor'
      
      const endTime = performance.now()
      const latency = endTime - startTime

      if (latency < 100) return 'excellent'
      if (latency < 300) return 'good'
      return 'poor'
    } catch (error) {
      return 'offline'
    }
  }, [])

  // Função para conectar
  const connect = useCallback(async (isRetry = false) => {
    if (!isClient()) {
      console.warn('⚠️ [CONNECTION] Tentativa de conexão no servidor ignorada')
      return
    }

    if (status.isConnecting && !isRetry) return
    
    isManuallyDisconnectedRef.current = false
    
    setStatus(prev => ({
      ...prev,
      isConnecting: true,
      hasError: false,
      errorMessage: null
    }))

    try {
      const quality = await testConnectionQuality()
      
      if (quality === 'offline') {
        throw new Error('Sem conexão com a internet')
      }

      // Simular teste de conectividade com API da Binance
      const response = await fetch('https://api.binance.com/api/v3/time', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        hasError: false,
        errorMessage: null,
        lastConnected: new Date(),
        reconnectAttempts: 0,
        connectionQuality: quality
      }))

      lastPingTimeRef.current = Date.now()
      onConnect?.()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na conexão'
      
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
        hasError: true,
        errorMessage,
        reconnectAttempts: prev.reconnectAttempts + 1,
        connectionQuality: 'offline'
      }))

      onError?.(errorMessage)

      // Tentar reconectar automaticamente se não excedeu o limite
      if (status.reconnectAttempts < maxRetries && !isManuallyDisconnectedRef.current) {
        const delay = retryDelay * Math.pow(1.5, status.reconnectAttempts) // Backoff exponencial
        
        retryTimeoutRef.current = setTimeout(() => {
          connect(true)
        }, delay)
      }
    }
  }, [status.isConnecting, status.reconnectAttempts, maxRetries, retryDelay, testConnectionQuality, onConnect, onError])

  // Função para desconectar manualmente
  const disconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    setStatus(prev => ({
      ...prev,
      isOnline: false,
      isConnecting: false,
      hasError: false,
      errorMessage: null,
      reconnectAttempts: 0,
      connectionQuality: 'offline'
    }))

    onDisconnect?.()
  }, [onDisconnect])

  // Função para tentar reconectar manualmente
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    setStatus(prev => ({
      ...prev,
      reconnectAttempts: 0,
      hasError: false,
      errorMessage: null
    }))
    
    connect()
  }, [connect])

  // Heartbeat para monitorar a conexão
  useEffect(() => {
    if (!isClient() || !enableHeartbeat || !status.isOnline) return

    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const quality = await testConnectionQuality()
        
        if (quality === 'offline') {
          throw new Error('Conexão perdida durante heartbeat')
        }

        setStatus(prev => ({
          ...prev,
          connectionQuality: quality,
          lastConnected: new Date()
        }))

        lastPingTimeRef.current = Date.now()
      } catch (error) {
        if (!isManuallyDisconnectedRef.current) {
          setStatus(prev => ({
            ...prev,
            isOnline: false,
            hasError: true,
            errorMessage: 'Conexão perdida',
            connectionQuality: 'offline'
          }))
          
          connect(true)
        }
      }
    }, heartbeatInterval)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [status.isOnline, enableHeartbeat, heartbeatInterval, connect, testConnectionQuality])

  // Monitorar mudanças na conectividade do navegador
  useEffect(() => {
    if (!isClient()) return

    const handleOnline = () => {
      if (!isManuallyDisconnectedRef.current) {
        connect()
      }
    }

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        connectionQuality: 'offline',
        hasError: true,
        errorMessage: 'Conexão com a internet perdida'
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connect])

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [])

  return {
    status,
    connect,
    disconnect,
    retry,
    testConnectionQuality,
    isRetrying: !!retryTimeoutRef.current,
    canRetry: status.reconnectAttempts < maxRetries || status.reconnectAttempts === 0
  }
} 