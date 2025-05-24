"use client"

import { create } from 'zustand'

// Tipos para os diferentes eventos WebSocket
export type KlineTick = {
  eventType: 'kline'
  eventTime: number
  symbol: string
  kline: {
    startTime: number
    endTime: number
    symbol: string
    interval: string
    firstTradeId: number
    lastTradeId: number
    open: string
    close: string
    high: string
    low: string
    volume: string
    trades: number
    final: boolean
    quoteVolume: string
    volumeActive: string
    quoteVolumeActive: string
  }
}

export type TickerTick = {
  eventType: 'ticker'
  eventTime: number
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvg: string
  prevDayClose: string
  curDayClose: string
  closeTradeQuantity: string
  bestBid: string
  bestBidQnt: string
  bestAsk: string
  bestAskQnt: string
  open: string
  high: string
  low: string
  volume: string
  volumeQuote: string
  openTime: number
  closeTime: number
  firstTradeId: number
  lastTradeId: number
  trades: number
}

export type TradeTick = {
  eventType: 'trade'
  eventTime: number
  symbol: string
  tradeId: number
  price: string
  quantity: string
  buyerOrderId: number
  sellerOrderId: number
  time: number
  isBuyerMaker: boolean
  isTradeMatchBest: boolean
}

export type DepthTick = {
  eventType: 'depthUpdate'
  eventTime: number
  symbol: string
  firstUpdateId: number
  finalUpdateId: number
  bids: [string, string][] // [price, quantity]
  asks: [string, string][] // [price, quantity]
}

// União de todos os tipos de eventos possíveis
export type WebSocketTick = KlineTick | TickerTick | TradeTick | DepthTick

// Estado da conexão WebSocket
export interface WebSocketConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
  lastMessage: number
  reconnectAttempts: number
  isHealthy: boolean
  latency: number
}

// Callbacks para os diferentes tipos de eventos
export type WebSocketCallbacks = {
  onMessage?: (data: WebSocketTick) => void
  onKline?: (data: KlineTick) => void
  onTicker?: (data: TickerTick) => void
  onTrade?: (data: TradeTick) => void
  onDepth?: (data: DepthTick) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onReconnect?: () => void
  onMaxRetriesReached?: () => void
}

// Configurações para as streams
export type WebSocketConfig = {
  symbols: string[]
  interval?: string
  callbacks: WebSocketCallbacks
  maxRetries?: number
  retryDelay?: number
  heartbeatInterval?: number
  enableAutoReconnect?: boolean
}

// Interface aprimorada para o gerenciador de WebSockets
export interface BinanceWebSocketManager {
  connections: Map<string, {
    socket: WebSocket
    state: WebSocketConnectionState
    config: WebSocketConfig
    heartbeatTimer?: NodeJS.Timeout
    reconnectTimer?: NodeJS.Timeout
    lastPingTime?: number
  }>
  createConnection: (streamName: string, config: WebSocketConfig) => void
  subscribeKline: (config: WebSocketConfig) => void
  subscribeTicker: (config: WebSocketConfig) => void
  subscribeTrade: (config: WebSocketConfig) => void
  subscribeDepth: (config: WebSocketConfig) => void
  unsubscribe: (streamName: string) => void
  unsubscribeAll: () => void
  isConnected: (streamName: string) => boolean
  getConnectionState: (streamName: string) => WebSocketConnectionState | null
  reconnect: (streamName: string) => void
  reconnectAll: () => void
  cleanup: () => void
}

// Constantes para configuração
const DEFAULT_MAX_RETRIES = 5
const DEFAULT_RETRY_DELAY = 3000
const DEFAULT_HEARTBEAT_INTERVAL = 30000
const MAX_MESSAGE_TIMEOUT = 60000 // 1 minuto sem mensagens = conexão morta

// Função auxiliar para verificar se estamos no cliente
const isClient = () => typeof window !== 'undefined'

// Estado global para gerenciar as conexões WebSocket aprimorado
export const useBinanceWebSocket = create<BinanceWebSocketManager>((set, get) => ({
  connections: new Map(),

  // Função auxiliar para criar uma nova conexão
  createConnection: (streamName: string, config: WebSocketConfig) => {
    // Só criar conexões no cliente
    if (!isClient()) {
      console.warn('⚠️ [BINANCE_WS] Tentativa de criar WebSocket no servidor ignorada')
      return
    }

    const {
      maxRetries = DEFAULT_MAX_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
      enableAutoReconnect = true,
      callbacks
    } = config

    // Limpar conexão existente se houver
    const existingConnection = get().connections.get(streamName)
    if (existingConnection) {
      existingConnection.socket?.close()
      if (existingConnection.heartbeatTimer) clearInterval(existingConnection.heartbeatTimer)
      if (existingConnection.reconnectTimer) clearTimeout(existingConnection.reconnectTimer)
    }

    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`
    const ws = new WebSocket(wsUrl)
    
    const connectionState: WebSocketConnectionState = {
      status: 'connecting',
      lastMessage: Date.now(),
      reconnectAttempts: 0,
      isHealthy: true,
      latency: 0
    }

    // Função de reconexão
    const attemptReconnection = () => {
      if (!enableAutoReconnect) return
      
      const currentConnection = get().connections.get(streamName)
      if (!currentConnection) return

      if (currentConnection.state.reconnectAttempts >= maxRetries) {
        callbacks.onMaxRetriesReached?.()
        return
      }

      currentConnection.state.status = 'reconnecting'
      currentConnection.state.reconnectAttempts++
      
      // Backoff exponencial com jitter
      const baseDelay = retryDelay * Math.pow(1.5, currentConnection.state.reconnectAttempts - 1)
      const jitter = Math.random() * 1000
      const delay = Math.min(baseDelay + jitter, 30000) // Max 30s

      console.log(`Tentando reconectar ${streamName} em ${Math.round(delay / 1000)}s (tentativa ${currentConnection.state.reconnectAttempts}/${maxRetries})`)

      currentConnection.reconnectTimer = setTimeout(() => {
        get().createConnection(streamName, config)
        callbacks.onReconnect?.()
      }, delay)

      // Atualizar estado
      const connections = get().connections
      connections.set(streamName, currentConnection)
      set({ connections: new Map(connections) })
    }

    // Configurar heartbeat para monitorar a saúde da conexão
    const setupHeartbeat = () => {
      return setInterval(() => {
        const currentConnection = get().connections.get(streamName)
        if (!currentConnection) return

        const timeSinceLastMessage = Date.now() - currentConnection.state.lastMessage
        
        if (timeSinceLastMessage > MAX_MESSAGE_TIMEOUT) {
          console.warn(`Conexão ${streamName} parece morta (${Math.round(timeSinceLastMessage / 1000)}s sem mensagens)`)
          currentConnection.state.isHealthy = false
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Heartbeat timeout')
          }
          
          attemptReconnection()
        } else {
          currentConnection.state.isHealthy = true
        }
      }, heartbeatInterval)
    }

    // Eventos WebSocket
    ws.onopen = (event) => {
      console.log(`✅ WebSocket conectado: ${streamName}`)
      
      connectionState.status = 'connected'
      connectionState.lastMessage = Date.now()
      connectionState.reconnectAttempts = 0
      connectionState.isHealthy = true

      const heartbeatTimer = setupHeartbeat()
      
      const connections = get().connections
      connections.set(streamName, {
        socket: ws,
        state: connectionState,
        config,
        heartbeatTimer,
        lastPingTime: Date.now()
      })
      set({ connections: new Map(connections) })

      callbacks.onOpen?.(event)
    }

    ws.onclose = (event) => {
      console.log(`❌ WebSocket desconectado: ${streamName} (código: ${event.code})`)
      
      const currentConnection = get().connections.get(streamName)
      if (currentConnection) {
        if (currentConnection.heartbeatTimer) {
          clearInterval(currentConnection.heartbeatTimer)
        }

        currentConnection.state.status = 'disconnected'
        
        // Só tentar reconectar se não foi fechamento manual (código 1000)
        if (event.code !== 1000 && enableAutoReconnect) {
          attemptReconnection()
        } else {
          // Remover completamente se foi fechamento manual
          const connections = get().connections
          connections.delete(streamName)
          set({ connections: new Map(connections) })
        }
      }

      callbacks.onClose?.(event)
    }

    ws.onerror = (event) => {
      console.error(`💥 Erro WebSocket: ${streamName}`, event)
      
      const currentConnection = get().connections.get(streamName)
      if (currentConnection) {
        currentConnection.state.status = 'error'
        currentConnection.state.isHealthy = false
      }

      callbacks.onError?.(event)
      
      // Tentar reconectar em caso de erro
      if (enableAutoReconnect) {
        attemptReconnection()
      }
    }

    ws.onmessage = (event) => {
      try {
        const startTime = performance.now()
        const data = JSON.parse(event.data)
        const endTime = performance.now()
        
        const currentConnection = get().connections.get(streamName)
        if (currentConnection) {
          currentConnection.state.lastMessage = Date.now()
          currentConnection.state.latency = endTime - startTime
          currentConnection.state.isHealthy = true
        }

        callbacks.onMessage?.(data)

        // Processar eventos específicos
        switch (data.eventType) {
          case 'kline':
            callbacks.onKline?.(data as KlineTick)
            break
          case 'ticker':
            callbacks.onTicker?.(data as TickerTick)
            break
          case 'trade':
            callbacks.onTrade?.(data as TradeTick)
            break
          case 'depthUpdate':
            callbacks.onDepth?.(data as DepthTick)
            break
        }
      } catch (error) {
        console.error('Erro ao processar mensagem do WebSocket:', error)
      }
    }

    // Armazenar informações iniciais da conexão
    const connections = get().connections
    connections.set(streamName, {
      socket: ws,
      state: connectionState,
      config
    })
    set({ connections: new Map(connections) })
  },

  subscribeKline: (config: WebSocketConfig) => {
    const { symbols, interval = '1m' } = config

    symbols.forEach(symbol => {
      const streamName = `${symbol.toLowerCase()}@kline_${interval}`
      get().createConnection(streamName, config)
    })
  },

  subscribeTicker: (config: WebSocketConfig) => {
    const { symbols } = config

    symbols.forEach(symbol => {
      const streamName = `${symbol.toLowerCase()}@ticker`
      get().createConnection(streamName, config)
    })
  },

  subscribeTrade: (config: WebSocketConfig) => {
    const { symbols } = config

    symbols.forEach(symbol => {
      const streamName = `${symbol.toLowerCase()}@trade`
      get().createConnection(streamName, config)
    })
  },

  subscribeDepth: (config: WebSocketConfig) => {
    const { symbols } = config

    symbols.forEach(symbol => {
      const streamName = `${symbol.toLowerCase()}@depth`
      get().createConnection(streamName, config)
    })
  },

  unsubscribe: (streamName: string) => {
    const connections = get().connections
    const connection = connections.get(streamName)

    if (connection) {
      if (connection.heartbeatTimer) clearInterval(connection.heartbeatTimer)
      if (connection.reconnectTimer) clearTimeout(connection.reconnectTimer)
      
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, 'Manual unsubscribe')
      }
      
      connections.delete(streamName)
      set({ connections: new Map(connections) })
    }
  },

  unsubscribeAll: () => {
    const connections = get().connections

    connections.forEach((connection, streamName) => {
      if (connection.heartbeatTimer) clearInterval(connection.heartbeatTimer)
      if (connection.reconnectTimer) clearTimeout(connection.reconnectTimer)
      
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, 'Unsubscribe all')
      }
    })

    set({ connections: new Map() })
  },

  isConnected: (streamName: string) => {
    const connection = get().connections.get(streamName)
    return connection?.socket?.readyState === WebSocket.OPEN && connection.state.isHealthy
  },

  getConnectionState: (streamName: string) => {
    const connection = get().connections.get(streamName)
    return connection?.state || null
  },

  reconnect: (streamName: string) => {
    const connection = get().connections.get(streamName)
    if (connection) {
      // Resetar contador de tentativas para permitir reconexão manual
      connection.state.reconnectAttempts = 0
      get().createConnection(streamName, connection.config)
    }
  },

  reconnectAll: () => {
    const connections = get().connections
    connections.forEach((connection, streamName) => {
      connection.state.reconnectAttempts = 0
      get().createConnection(streamName, connection.config)
    })
  },

  cleanup: () => {
    get().unsubscribeAll()
  }
}))

// Função auxiliar para formatar nome da stream
export const formatStreamName = (symbol: string, type: 'kline' | 'ticker' | 'trade' | 'depth', interval?: string) => {
  switch (type) {
    case 'kline':
      return `${symbol.toLowerCase()}@kline_${interval || '1m'}`
    case 'ticker':
      return `${symbol.toLowerCase()}@ticker`
    case 'trade':
      return `${symbol.toLowerCase()}@trade`
    case 'depth':
      return `${symbol.toLowerCase()}@depth`
  }
}
