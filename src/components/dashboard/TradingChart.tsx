"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts"
import { BinanceService, type KlineData } from "@/lib/services/binance"
import { useBinanceWebSocket, type KlineTick } from "@/lib/services/binanceWebSocket"
import { toast } from "sonner"
import { useBinance } from "@/lib/context/BinanceContext"
import { useConnection } from "@/hooks/useConnection"
import ConnectionErrorState from "@/components/dashboard/ConnectionErrorState"
import { useRealtimeChart } from "@/hooks/useRealtimeChart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"

// Tipos para os dados de candle
interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Utilitário para converter dados da Binance para o formato do gráfico
const formatCandlestickData = (klineData: KlineData[]) => {
  return klineData.map(candle => ({
    time: (candle.openTime / 1000) as Time,
    open: Number.parseFloat(candle.open),
    high: Number.parseFloat(candle.high),
    low: Number.parseFloat(candle.low),
    close: Number.parseFloat(candle.close),
    volume: Number.parseFloat(candle.volume),
  }))
}

// Componente para mostrar métricas de preço
const PriceMetrics = ({ data, symbol }: { data: CandleData[]; symbol: string }) => {
  if (!data || data.length === 0) return null

  const lastCandle = data[data.length - 1]
  const currentPrice = lastCandle?.close || 50000
  
  // Calcular variação de 24h baseado em dados reais
  let priceChange24h = 0
  let priceChangePercent24h = 0
  let price24hAgo = currentPrice
  
  if (data.length > 1) {
    // Tentar encontrar o candle de 24h atrás baseado no timestamp
    const now = lastCandle.time as number
    const twentyFourHoursAgo = now - (24 * 60 * 60) // 24 horas em segundos
    
    // Encontrar o candle mais próximo de 24h atrás
    let closestCandle = data[0]
    let closestTimeDiff = Math.abs((closestCandle.time as number) - twentyFourHoursAgo)
    
    for (const candle of data) {
      const timeDiff = Math.abs((candle.time as number) - twentyFourHoursAgo)
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff
        closestCandle = candle
      }
    }
    
    price24hAgo = closestCandle.close
    priceChange24h = currentPrice - price24hAgo
    priceChangePercent24h = ((priceChange24h / price24hAgo) * 100)
  }
  
  const isPositive = priceChange24h >= 0

  // Calcular máxima e mínima das últimas 24h (usar dados recentes)
  const recentData = data.slice(-Math.min(data.length, 288)) // Últimas 288 velas (24h para intervalo de 5min)
  const high24h = Math.max(...recentData.map(candle => candle.high))
  const low24h = Math.min(...recentData.map(candle => candle.low))

  // Função para formatar valores de forma inteligente
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`
    } else if (price >= 100) {
      return `$${price.toFixed(2)}`
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  const formatChange = (change: number) => {
    if (Math.abs(change) >= 1000000) {
      return `${(change / 1000000).toFixed(2)}M`
    } else if (Math.abs(change) >= 1000) {
      return `${(change / 1000).toFixed(1)}K`
    } else if (Math.abs(change) >= 100) {
      return change.toFixed(2)
    } else {
      return change.toFixed(4)
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {/* Preço Atual */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-gray-700/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">Preço Atual</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>
        <div className="min-h-[2rem] flex items-center">
          <div className="text-lg lg:text-xl xl:text-2xl font-bold text-white break-all leading-tight">
            {formatPrice(currentPrice)}
          </div>
        </div>
      </div>

      {/* Variação 24h */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-gray-700/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">Variação 24h</span>
          {isPositive ? <TrendingUp className="h-3 w-3 text-green-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
        </div>
        <div className="min-h-[2rem] flex flex-col justify-center">
          <div className={`text-lg lg:text-xl xl:text-2xl font-bold leading-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChangePercent24h.toFixed(2)}%
          </div>
          <div className={`text-xs mt-1 ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
            {isPositive ? '+' : ''}${formatChange(priceChange24h)}
          </div>
        </div>
      </div>

      {/* Máxima 24h */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-gray-700/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">Máxima 24h</span>
          <div className="w-2 h-2 rounded-full bg-green-400/50"></div>
        </div>
        <div className="min-h-[2rem] flex items-center">
          <div className="text-lg lg:text-xl xl:text-2xl font-bold text-white break-all leading-tight">
            {formatPrice(high24h)}
          </div>
        </div>
      </div>

      {/* Mínima 24h */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 border border-gray-700/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">Mínima 24h</span>
          <div className="w-2 h-2 rounded-full bg-red-400/50"></div>
        </div>
        <div className="min-h-[2rem] flex items-center">
          <div className="text-lg lg:text-xl xl:text-2xl font-bold text-white break-all leading-tight">
            {formatPrice(low24h)}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TradingChartProps {
  symbol?: string;
  interval?: string;
}

// Componente para o gráfico de trading
const TradingChart = ({ symbol = "BTCUSDT", interval = "1m" }: TradingChartProps) => {
  const { binanceService, isMasterConnected } = useBinance()
  
  const [selectedSymbol, setSelectedSymbol] = useState(symbol)
  const [selectedInterval, setSelectedInterval] = useState(interval)
  const [candleData, setCandleData] = useState<CandleData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Hook para gerenciar atualizações em tempo real
  const realtimeChart = useRealtimeChart({
    symbol: selectedSymbol,
    interval: selectedInterval,
    onDataUpdate: useCallback((data: KlineTick) => {
      if (!seriesRef.current) return

      const update = {
        time: (data.kline.startTime / 1000) as Time,
        open: Number.parseFloat(data.kline.open),
        high: Number.parseFloat(data.kline.high),
        low: Number.parseFloat(data.kline.low),
        close: Number.parseFloat(data.kline.close),
        volume: Number.parseFloat(data.kline.volume)
      }

      setCandleData(currentData => {
        const newData = [...currentData]
        const lastIndex = newData.length - 1

        if (lastIndex >= 0 && newData[lastIndex].time === update.time) {
          newData[lastIndex] = update
        } else if (lastIndex >= 0) {
          newData.push(update)
        }
        return newData
      })

      seriesRef.current.update(update)
    }, []),
    enableAutoReconnect: true,
    maxRetries: 10,
    retryDelay: 2000,
    inactivityTimeout: 120000
  })

  // Sync props with internal state only when they change
  useEffect(() => {
    setSelectedSymbol(symbol)
  }, [symbol])
  
  useEffect(() => {
    setSelectedInterval(interval)
  }, [interval])

  // Memoize loadHistoricalData to prevent recreation on every render
  const loadHistoricalData = useCallback(async () => {
    if (!seriesRef.current || !isMasterConnected || !isClient) return
    
    setIsLoading(true)
    setError(null)

    try {
      // Buscar mais dados para cálculos precisos de 24h
      const limit = selectedInterval === '1m' ? 1440 : // 24h em minutos
                    selectedInterval === '5m' ? 288 :  // 24h em 5min
                    selectedInterval === '15m' ? 96 :  // 24h em 15min
                    selectedInterval === '1h' ? 24 :   // 24h em horas
                    selectedInterval === '4h' ? 6 :    // 24h em 4h
                    selectedInterval === '1d' ? 30 :   // 30 dias
                    200

      const klineData = await binanceService.getKlines(selectedSymbol, selectedInterval, limit)
      const candlestickData = formatCandlestickData(klineData)

      seriesRef.current.setData(candlestickData)
      setCandleData(candlestickData)

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (error) {
      console.error('Erro ao carregar dados históricos:', error)
      setError('Falha ao carregar dados históricos. Verifique sua conexão.')
      toast.error('Erro ao carregar dados', {
        description: 'Não foi possível carregar os dados do gráfico. Tente novamente mais tarde.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [binanceService, selectedSymbol, selectedInterval, isMasterConnected, isClient])

  // Chart initialization - only when container is available and we're on client
  useEffect(() => {
    if (!chartContainerRef.current || !isClient) return

    // Cleanup existing chart
    try {
      if (chartRef.current) {
        chartRef.current.remove()
      }
    } catch (error) {
      console.log('Chart já foi removido ou não existe')
    }

    // Função auxiliar para obter dimensões responsivas
    const getResponsiveHeight = () => {
      if (typeof window === 'undefined') return 450 // Valor padrão para SSR
      return window.innerWidth < 640 ? 350 : 450
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.2)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.2)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: getResponsiveHeight(),
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(55, 65, 81, 0.3)',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(99, 102, 241, 0.5)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(99, 102, 241, 0.5)',
          width: 1,
          style: 2,
        },
      },
    })

    const handleResize = () => {
      if (chartContainerRef.current && typeof window !== 'undefined') {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: getResponsiveHeight()
        })
      }
    }

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    })

    chartRef.current = chart
    seriesRef.current = candlestickSeries

    // Só adicionar listeners no cliente
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
      try {
        chart.remove()
      } catch (error) {
        console.log('Chart cleanup error:', error)
      }
    }
  }, [isClient]) // Only run when client is ready

  // Load data when chart is ready or symbol/interval changes
  useEffect(() => {
    if (chartRef.current && seriesRef.current && isClient) {
      loadHistoricalData()
    }
  }, [selectedSymbol, selectedInterval, loadHistoricalData, isClient])

  // Função para tentar reconectar manualmente
  const handleManualRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    
    // Tentar reconectar o sistema de tempo real
    realtimeChart.reconnect()
    
    // Recarregar dados históricos
    setTimeout(() => {
      loadHistoricalData()
    }, 1000)
  }, [realtimeChart, loadHistoricalData])

  // Show loading while waiting for client hydration
  if (!isClient) {
    return (
      <div className="w-full h-[350px] md:h-[450px] flex items-center justify-center bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
        <div className="flex flex-col items-center px-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-3 text-gray-400 text-center text-sm md:text-base">Inicializando gráfico...</p>
          <p className="mt-1 text-gray-500 text-xs md:text-sm">Aguardando conexão</p>
        </div>
      </div>
    )
  }

  // Estados de loading e erro com design responsivo
  if (isLoading && !seriesRef.current) {
    return (
      <div ref={chartContainerRef} className="w-full h-[350px] md:h-[450px] flex items-center justify-center bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
        <div className="flex flex-col items-center px-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-3 text-gray-400 text-center text-sm md:text-base">Carregando dados do gráfico...</p>
          <p className="mt-1 text-gray-500 text-xs md:text-sm">Conectando aos servidores de dados</p>
        </div>
      </div>
    )
  }

  // Estado de erro com componente especializado
  if ((error || realtimeChart.hasError) && !realtimeChart.internetConnected) {
    return (
      <div ref={chartContainerRef} className="w-full h-[350px] md:h-[450px]">
        <ConnectionErrorState
          status={realtimeChart.globalConnectionStatus}
          onRetry={handleManualRetry}
          isRetrying={realtimeChart.isRetrying || isLoading}
          canRetry={realtimeChart.canRetry}
          size="md"
          showDetails={true}
          className="h-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Barra de status da conexão para mobile */}
      <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-2 md:p-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            realtimeChart.isConnected && realtimeChart.internetConnected ? 'bg-green-400 animate-pulse' : 
            realtimeChart.isConnecting ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`}></div>
          <span className="text-xs md:text-sm text-gray-300">
            {realtimeChart.isConnected && realtimeChart.internetConnected ? 'Tempo real ativo' :
             realtimeChart.isConnecting ? 'Conectando...' :
             'Dados desatualizados'}
          </span>
          
          {/* Badge de qualidade da conexão */}
          {realtimeChart.isConnected && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                realtimeChart.connectionQuality === 'excellent' ? 'border-green-500/30 text-green-400' :
                realtimeChart.connectionQuality === 'good' ? 'border-blue-500/30 text-blue-400' :
                realtimeChart.connectionQuality === 'poor' ? 'border-yellow-500/30 text-yellow-400' :
                'border-red-500/30 text-red-400'
              }`}
            >
              {realtimeChart.connectionQuality === 'excellent' ? 'Excelente' :
               realtimeChart.connectionQuality === 'good' ? 'Boa' :
               realtimeChart.connectionQuality === 'poor' ? 'Fraca' : 'Offline'}
            </Badge>
          )}
        </div>
        
        {realtimeChart.lastUpdateTime && (
          <span className="text-xs text-gray-400 hidden sm:block">
            Última atualização: {realtimeChart.lastUpdateTime.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        )}
        
        {(error || realtimeChart.hasError) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRetry}
            disabled={realtimeChart.isRetrying || isLoading}
            className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700 h-6 px-2 md:h-8 md:px-3"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${(realtimeChart.isRetrying || isLoading) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reconectar</span>
            <span className="sm:hidden">↻</span>
          </Button>
        )}
      </div>

      {/* Container do gráfico */}
      <div ref={chartContainerRef} className="w-full h-[350px] md:h-[450px] bg-gradient-to-br from-gray-900/20 to-gray-800/20 rounded-2xl border border-gray-700/20 backdrop-blur-sm" />
      
      {/* Métricas de preço - só mostrar se tiver dados */}
      {!isLoading && !error && candleData.length > 0 && (
        <PriceMetrics data={candleData} symbol={selectedSymbol} />
      )}
    </div>
  )
}

export default TradingChart 