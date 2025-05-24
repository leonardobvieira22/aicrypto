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
  const prevCandle = data.length > 1 ? data[data.length - 2] : null

  const currentPrice = lastCandle.close.toFixed(2)
  const priceChange = prevCandle ? (lastCandle.close - prevCandle.close).toFixed(2) : "0.00"
  const priceChangePercent = prevCandle ? (((lastCandle.close - prevCandle.close) / prevCandle.close) * 100).toFixed(2) : "0.00"
  const isPositive = Number.parseFloat(priceChange) >= 0

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`
    return volume.toFixed(2)
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <span className="text-xs text-gray-400 font-medium">Preço Atual</span>
        <div className="text-xl font-bold text-white mt-1">${currentPrice}</div>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <span className="text-xs text-gray-400 font-medium">Variação 24h</span>
        <div className={`text-xl font-bold mt-1 flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {isPositive ? '+' : ''}{priceChangePercent}%
        </div>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <span className="text-xs text-gray-400 font-medium">Máxima 24h</span>
        <div className="text-xl font-bold text-white mt-1">${lastCandle.high.toFixed(2)}</div>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <span className="text-xs text-gray-400 font-medium">Mínima 24h</span>
        <div className="text-xl font-bold text-white mt-1">${lastCandle.low.toFixed(2)}</div>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <span className="text-xs text-gray-400 font-medium">Volume 24h</span>
        <div className="text-xl font-bold text-white mt-1">{formatVolume(lastCandle.volume)}</div>
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
      const klineData = await binanceService.getKlines(selectedSymbol, selectedInterval, 100)
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
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(55, 65, 81, 0.5)',
      },
      crosshair: {
        mode: 1,
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
      <div ref={chartContainerRef} className="w-full h-[400px] flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-700/50">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-2 text-gray-400">Carregando dados do gráfico...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={chartContainerRef} className="w-full h-[400px] flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-700/50">
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
      <div ref={chartContainerRef} className="w-full h-[400px] bg-gray-900/30 rounded-xl border border-gray-700/50 p-4" />
      {!isLoading && !error && <div className="mt-4"><PriceMetrics data={candleData} symbol={selectedSymbol} /></div>}
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

// Componente principal do Dashboard
export default function Dashboard() {
  const [selectedPair, setSelectedPair] = useState("BTCUSDT")
  const [selectedInterval, setSelectedInterval] = useState("1m")

  const tradingPairs = [
    { value: "BTCUSDT", label: "BTC/USDT" },
    { value: "ETHUSDT", label: "ETH/USDT" },
    { value: "BNBUSDT", label: "BNB/USDT" },
    { value: "SOLUSDT", label: "SOL/USDT" },
    { value: "ADAUSDT", label: "ADA/USDT" },
  ]

  const timeIntervals = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1d", label: "1d" },
  ]

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
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">
                    {tradingPairs.find(p => p.value === selectedPair)?.label || "BTC/USDT"}
                  </h2>
                </div>
                <p className="text-gray-400 text-sm">Dados em tempo real</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <select
                  className="w-full sm:w-auto bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                >
                  {tradingPairs.map((pair) => (
                    <option key={pair.value} value={pair.value}>
                      {pair.label}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full sm:w-auto bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <TradingChart symbol={selectedPair} interval={selectedInterval} />
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
