"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Bell,
  Bot,
  Users,
  PieChart,
  BarChart3,
  Activity,
  DollarSign,
  Zap,
  Eye,
  Play,
  Pause,
  Settings,
  ExternalLink,
  Copy,
  RefreshCw,
  Filter,
  Calendar,
  MoreVertical
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts"
import { BinanceService, type KlineData } from "@/lib/services/binance"
import { useBinanceWebSocket, type KlineTick } from "@/lib/services/binanceWebSocket"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useBinance } from "@/lib/context/BinanceContext"

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

// Função para gerar dados de demonstração de velas aleatórias
const generateDemoData = (symbol: string, interval: string, count = 100) => {
  const now = new Date().getTime();
  const millisecondsPerCandle = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }[interval] || 60 * 1000;

  // Preços iniciais para diferentes símbolos
  const basePrice = {
    'BTCUSDT': 50000,
    'ETHUSDT': 3000,
    'BNBUSDT': 400,
    'SOLUSDT': 100,
    'ADAUSDT': 1.5,
  }[symbol] || 50000;

  // Volatilidade para diferentes símbolos
  const volatility = {
    'BTCUSDT': 0.02,
    'ETHUSDT': 0.025,
    'BNBUSDT': 0.03,
    'SOLUSDT': 0.035,
    'ADAUSDT': 0.04,
  }[symbol] || 0.02;

  const data = [];
  let lastClose = basePrice;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * millisecondsPerCandle;
    const changePercent = (Math.random() - 0.5) * volatility;
    const change = lastClose * changePercent;

    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = basePrice * (Math.random() * 10 + 5);

    data.push({
      time: timestamp / 1000,
      open,
      high,
      low,
      close,
      volume,
    });

    lastClose = close;
  }

  return data;
};

// Componente para mostrar métricas de preço
const PriceMetrics = ({ data, symbol }: { data: CandleData[]; symbol: string }) => {
  if (!data || data.length === 0) return null

  const lastCandle = data[data.length - 1]
  const currentPrice = lastCandle.close
  
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

// Componente para o gráfico de trading
const TradingChart = ({ symbol = "BTCUSDT", interval = "1m" }) => {
  const { binanceService, isMasterConnected } = useBinance()
  const binanceWebSocket = useBinanceWebSocket()
  
  const [selectedSymbol, setSelectedSymbol] = useState(symbol)
  const [selectedInterval, setSelectedInterval] = useState(interval)
  const [candleData, setCandleData] = useState<CandleData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  // Sync props with internal state only when they change
  useEffect(() => {
    setSelectedSymbol(symbol)
  }, [symbol])
  
  useEffect(() => {
    setSelectedInterval(interval)
  }, [interval])

  // Memoize loadHistoricalData to prevent recreation on every render
  const loadHistoricalData = useCallback(async () => {
    if (!seriesRef.current) return
    
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
      setError('Não foi possível carregar os dados do gráfico. Verifique a conexão com a API.')
      toast.error('Erro ao carregar dados', {
        description: 'Não foi possível carregar os dados do gráfico. Tente novamente mais tarde.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [binanceService, selectedSymbol, selectedInterval]) // Only these dependencies

  // Stable handleKlineUpdate callback
  const handleKlineUpdate = useCallback((data: KlineTick) => {
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
  }, [])

  // WebSocket subscription - removed binanceWebSocket from dependencies to prevent recreation
  useEffect(() => {
    if (!isMasterConnected) return

    const streamName = `${selectedSymbol.toLowerCase()}@kline_${selectedInterval}`
    
    binanceWebSocket.subscribeKline({
      symbols: [selectedSymbol],
      interval: selectedInterval,
      callbacks: {
        onKline: handleKlineUpdate,
        onOpen: () => {
          console.log(`WebSocket conectado para ${streamName}`)
        },
        onError: (event) => {
          console.error('Erro na conexão WebSocket:', event)
          setError('Erro na conexão em tempo real. Os dados podem estar desatualizados.')
        }
      }
    })

    return () => {
      binanceWebSocket.unsubscribe(streamName)
    }
  }, [selectedSymbol, selectedInterval, handleKlineUpdate, isMasterConnected]) // removed binanceWebSocket

  // Chart initialization - only when container is available, do not depend on loadHistoricalData
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Cleanup existing chart
    try {
      if (chartRef.current) {
        chartRef.current.remove()
      }
    } catch (error) {
      console.log('Chart já foi removido ou não existe')
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
      height: 450,
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
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth
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

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      try {
        chart.remove()
      } catch (error) {
        console.log('Chart cleanup error:', error)
      }
    }
  }, []) // Empty dependency array - only run once

  // Load data when chart is ready or symbol/interval changes
  useEffect(() => {
    if (chartRef.current && seriesRef.current) {
      loadHistoricalData()
    }
  }, [selectedSymbol, selectedInterval, loadHistoricalData])

  if (isLoading && !seriesRef.current) {
    return (
      <div ref={chartContainerRef} className="w-full h-[450px] flex items-center justify-center bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-2 text-gray-400">Carregando dados do gráfico...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={chartContainerRef} className="w-full h-[450px] flex items-center justify-center bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <span className="text-red-400 text-4xl mb-2">!</span>
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistoricalData}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div ref={chartContainerRef} className="w-full h-[450px] bg-gradient-to-br from-gray-900/20 to-gray-800/20 rounded-2xl border border-gray-700/20 backdrop-blur-sm" />
      {!isLoading && !error && <PriceMetrics data={candleData} symbol={selectedSymbol} />}
    </div>
  )
}

// Componente para cards de desempenho de robôs
const RobotPerformanceCard = ({ name, return: returnValue, pairs, risk, active = true }: any) => {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6 hover:bg-gray-900/70 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{name}</h3>
            <p className="text-xs text-gray-400">{pairs}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={active ? "default" : "outline"}
            className={active ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-gray-600 text-gray-400"}
          >
            {active ? "Ativo" : "Inativo"}
          </Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs text-gray-400">Retorno Mensal</span>
          <div className="text-2xl font-bold text-green-400 mt-1">{returnValue}</div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Nível de Risco</span>
            <div className="flex items-center mt-1">
              <Badge
                className={`${
                  risk === "Conservador" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                  risk === "Moderado" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                  "bg-red-500/20 text-red-400 border-red-500/30"
                } text-xs`}
                variant="outline"
              >
                {risk}
              </Badge>
            </div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            {active ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {active ? "Pausar" : "Ativar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componentes de ícones das criptomoedas
const CryptoIcon = ({ symbol }: { symbol: string }) => {
  const iconProps = "w-6 h-6 text-white"
  
  switch (symbol) {
    case "BTCUSDT":
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.999 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.626 0 11.999 0zM15.504 13.195c-.235 1.588-1.347 2.066-2.887 2.065v1.63h-1.19v-1.59h-.955v1.59h-1.19v-1.63l-1.548-.002v-1.145s.88.02.865 0c.483 0 .661-.315.661-.622V9.598c0-.307-.178-.622-.661-.622.015-.02-.865 0-.865 0V7.831l1.548-.002V6.233h1.19v1.565h.955V6.233h1.19v1.596c1.925.117 3.267.695 3.438 2.825.138 1.72-.648 2.557-1.932 2.843.913.201 1.387.777 1.381 1.698zM14.25 10.23c0-1.433-1.297-1.407-2.37-1.407v2.814c1.073 0 2.37.026 2.37-1.407zm-.571 3.338c0-1.518-1.503-1.488-2.657-1.488v2.976c1.154 0 2.657.03 2.657-1.488z"/>
        </svg>
      )
    case "ETHUSDT":
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
        </svg>
      )
    case "BNBUSDT":
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.353 2.7175-2.7154L11.999 18.2042l4.625-4.284zm.001-2.8712L11.999 16.6867l-4.625-5.5677L11.999 5.6202l4.625 5.4988z"/>
          <path d="M21.092 8.174l-2.7175-2.715-7.352 7.353-7.353-7.353-2.7175 2.715L7.625 14.8472l4.374 4.375 4.375-4.375 4.718-6.6732z"/>
        </svg>
      )
    case "SOLUSDT":
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.17 12.54a.94.94 0 0 1 .69-.29h13.86a.47.47 0 0 1 .33.8l-2.77 2.77a.94.94 0 0 1-.69.29H1.73a.47.47 0 0 1-.33-.8zm0-5.1a.94.94 0 0 1 .69-.29h13.86a.47.47 0 0 1 .33.8L16.28 10.72a.94.94 0 0 1-.69.29H1.73a.47.47 0 0 1-.33-.8zm15.66-2.77L17.06 7.44a.94.94 0 0 1-.69.29H2.51a.47.47 0 0 1-.33-.8L4.95 4.16a.94.94 0 0 1 .69-.29h13.86a.47.47 0 0 1 .33.8z"/>
        </svg>
      )
    case "ADAUSDT":
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L8.25 7.5h7.5L12 0zM8.25 16.5L12 24l3.75-7.5H8.25zM0 12l7.5-3.75v7.5L0 12zM24 12l-7.5 3.75v-7.5L24 12zM9.75 12L12 7.5 14.25 12 12 16.5 9.75 12z"/>
        </svg>
      )
    default:
      return (
        <svg className={iconProps} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white">?</text>
        </svg>
      )
  }
}

// Componente principal do Dashboard
export default function Dashboard() {
  const [selectedPair, setSelectedPair] = useState("BTCUSDT")
  const [selectedInterval, setSelectedInterval] = useState("1m")

  const tradingPairs = [
    { value: "BTCUSDT", label: "BTC/USDT", color: "from-orange-500 to-orange-600" },
    { value: "ETHUSDT", label: "ETH/USDT", color: "from-blue-500 to-blue-600" },
    { value: "BNBUSDT", label: "BNB/USDT", color: "from-yellow-500 to-yellow-600" },
    { value: "SOLUSDT", label: "SOL/USDT", color: "from-purple-500 to-purple-600" },
    { value: "ADAUSDT", label: "ADA/USDT", color: "from-blue-400 to-blue-500" },
  ]

  const timeIntervals = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1d", label: "1d" },
  ]

  const getCurrentPair = () => tradingPairs.find(p => p.value === selectedPair) || tradingPairs[0]

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Bem-vindo de volta, <span className="text-blue-400">João Silva</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Últimos 30 dias</span>
            <span className="sm:hidden">30 dias</span>
          </Button>
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
            <Zap className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upgrade Pro</span>
            <span className="sm:hidden">Pro</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Saldo Total</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-white">$15,234.12</span>
              </div>
              <div className="flex items-center mt-3 text-sm">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400 font-medium">+12.5%</span>
                <span className="text-gray-400 ml-1">este mês</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Lucro 24h</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-green-400">+$342.58</span>
              </div>
              <div className="flex items-center mt-3 text-sm">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400 font-medium">+3.2%</span>
                <span className="text-gray-400 ml-1">das operações</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Robôs Ativos</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-white">2</span>
                <span className="text-gray-400 text-lg ml-1">/5</span>
              </div>
              <div className="flex items-center mt-3">
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                  Plano Gratuito
                </Badge>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Win Rate</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-white">78%</span>
              </div>
              <div className="flex items-center mt-3 text-sm">
                <Activity className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-gray-400">347 operações</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Trading Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="xl:col-span-2"
        >
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
            {/* Cabeçalho do Gráfico */}
            <div className="flex flex-col space-y-4 p-6 border-b border-gray-700/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Título e Ícone Centralizados */}
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getCurrentPair().color} rounded-xl flex items-center justify-center`}>
                    <CryptoIcon symbol={selectedPair} />
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-none" style={{ fontSize: '28px', lineHeight: '40px' }}>
                    {getCurrentPair().label}
                  </h2>
                </div>
                
                {/* Controles */}
                <div className="flex flex-row items-center justify-center sm:justify-end space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 font-medium">Par:</span>
                    <select
                      className="bg-gray-800/60 border border-gray-600/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      value={selectedPair}
                      onChange={(e) => setSelectedPair(e.target.value)}
                    >
                      {tradingPairs.map((pair) => (
                        <option key={pair.value} value={pair.value}>
                          {pair.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 font-medium">Intervalo:</span>
                    <select
                      className="bg-gray-800/60 border border-gray-600/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      value={selectedInterval}
                      onChange={(e) => setSelectedInterval(e.target.value)}
                    >
                      {timeIntervals.map((interval) => (
                        <option key={interval.value} value={interval.value}>
                          {interval.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Área do Gráfico */}
            <div className="p-6">
              <TradingChart symbol={selectedPair} interval={selectedInterval} />
            </div>
          </div>
        </motion.div>

        {/* Robot Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Seus Robôs</h2>
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <RobotPerformanceCard
                name="RSI Master"
                return="+5.8%"
                pairs="BTC, ETH, SOL"
                risk="Moderado"
                active={true}
              />
              <RobotPerformanceCard
                name="Bollinger IA"
                return="+4.2%"
                pairs="BTC, ETH, BNB"
                risk="Conservador"
                active={true}
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                <Bot className="h-4 w-4 mr-2" />
                Adicionar Robô
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Operações Recentes</h2>
            <Link href="/dashboard/history">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Ver todas
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item, i) => (
              <div key={`recent-operation-${item}`} className="flex items-center justify-between p-4 hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item % 2 === 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item % 2 === 0 ?
                      <ArrowUpRight className="h-5 w-5" /> :
                      <ArrowDownRight className="h-5 w-5" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {item % 2 === 0 ? 'Compra' : 'Venda'} BTC/USDT
                    </p>
                    <p className="text-sm text-gray-400">
                      Há {20 + i * 12} minutos • RSI Master
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    {item % 2 === 0 ? '+' : '-'}0.0{item + 1} BTC
                  </p>
                  <p className={`text-sm ${item % 2 === 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item % 2 === 0 ? '+' : '-'}${(item + 1) * 120}.{item * 2}{item + 3}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
