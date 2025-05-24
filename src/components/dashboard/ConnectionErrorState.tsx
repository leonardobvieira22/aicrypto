"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  WifiOff,
  RefreshCw,
  Signal,
  SignalHigh,
  SignalLow,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Smartphone,
  Monitor
} from 'lucide-react'
import { ConnectionStatus } from '@/hooks/useConnection'
import { cn } from '@/lib/utils'

interface ConnectionErrorStateProps {
  status: ConnectionStatus
  onRetry: () => void
  isRetrying: boolean
  canRetry: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function ConnectionErrorState({
  status,
  onRetry,
  isRetrying,
  canRetry,
  className,
  size = 'md',
  showDetails = true
}: ConnectionErrorStateProps) {
  const getConnectionIcon = () => {
    if (status.isConnecting || isRetrying) {
      return <Loader2 className="h-8 w-8 md:h-12 md:w-12 text-blue-500 animate-spin" />
    }

    if (status.isOnline && !status.hasError) {
      return <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-green-500" />
    }

    switch (status.connectionQuality) {
      case 'excellent':
        return <Signal className="h-8 w-8 md:h-12 md:w-12 text-green-500" />
      case 'good':
        return <SignalHigh className="h-8 w-8 md:h-12 md:w-12 text-blue-500" />
      case 'poor':
        return <SignalLow className="h-8 w-8 md:h-12 md:w-12 text-yellow-500" />
      case 'offline':
      default:
        return <WifiOff className="h-8 w-8 md:h-12 md:w-12 text-red-500" />
    }
  }

  const getStatusText = () => {
    if (status.isConnecting) return 'Conectando...'
    if (isRetrying) return 'Tentando reconectar...'
    if (status.isOnline && !status.hasError) return 'Conexão estabelecida'
    if (status.hasError) return status.errorMessage || 'Erro na conexão'
    return 'Conexão perdida'
  }

  const getStatusColor = () => {
    if (status.isConnecting || isRetrying) return 'text-blue-500'
    if (status.isOnline && !status.hasError) return 'text-green-500'
    if (status.hasError) return 'text-red-500'
    return 'text-yellow-500'
  }

  const getQualityBadge = () => {
    if (!status.isOnline) return null

    const qualityConfig = {
      excellent: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Excelente' },
      good: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Boa' },
      poor: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Fraca' },
      offline: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Offline' }
    }

    const config = qualityConfig[status.connectionQuality]
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    )
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const textSizeClasses = {
    sm: {
      title: 'text-lg md:text-xl',
      description: 'text-sm',
      button: 'text-sm'
    },
    md: {
      title: 'text-xl md:text-2xl',
      description: 'text-sm md:text-base',
      button: 'text-sm md:text-base'
    },
    lg: {
      title: 'text-2xl md:text-3xl',
      description: 'text-base md:text-lg',
      button: 'text-base'
    }
  }

  const currentTextSizes = textSizeClasses[size]

  return (
    <Card className={cn(
      "w-full bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/30 backdrop-blur-sm",
      sizeClasses[size],
      className
    )}>
      <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
        {/* Ícone principal */}
        <div className="flex flex-col items-center space-y-2">
          {getConnectionIcon()}
          {showDetails && getQualityBadge()}
        </div>

        {/* Texto principal */}
        <div className="space-y-2">
          <h3 className={cn(
            "font-bold text-white leading-tight",
            currentTextSizes.title
          )}>
            {getStatusText()}
          </h3>
          
          {showDetails && (
            <p className={cn(
              "text-gray-400 max-w-md mx-auto leading-relaxed",
              currentTextSizes.description
            )}>
              {status.hasError ? (
                "Problemas na conexão com os servidores. Verifique sua internet e tente novamente."
              ) : status.isConnecting ? (
                "Estabelecendo conexão com os servidores de dados em tempo real..."
              ) : (
                "Dados de mercado atualizados em tempo real disponíveis."
              )}
            </p>
          )}
        </div>

        {/* Informações adicionais para mobile */}
        {showDetails && (status.hasError || !status.isOnline) && (
          <div className="w-full max-w-sm space-y-3">
            {/* Status de tentativas */}
            {status.reconnectAttempts > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
                <span>Tentativas de reconexão:</span>
                <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                  {status.reconnectAttempts}/5
                </Badge>
              </div>
            )}

            {/* Última conexão */}
            {status.lastConnected && (
              <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
                <span>Última conexão:</span>
                <span className="text-gray-300">
                  {status.lastConnected.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          {(status.hasError || !status.isOnline) && canRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying || status.isConnecting}
              className={cn(
                "flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                currentTextSizes.button
              )}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {isRetrying || status.isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Reconectando...</span>
                  <span className="sm:hidden">Conectando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tentar Novamente</span>
                  <span className="sm:hidden">Tentar</span>
                </>
              )}
            </Button>
          )}

          {/* Botão de diagnóstico para casos severos */}
          {status.reconnectAttempts >= 3 && (
            <Button
              variant="outline"
              className={cn(
                "flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 transition-all duration-200",
                currentTextSizes.button
              )}
              size={size === 'sm' ? 'sm' : 'default'}
              onClick={() => {
                // Abrir página de diagnóstico ou suporte
                window.open('/suporte/conectividade', '_blank')
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Diagnóstico</span>
              <span className="sm:hidden">Ajuda</span>
            </Button>
          )}
        </div>

        {/* Indicador responsivo */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Smartphone className="h-3 w-3 sm:hidden" />
            <Monitor className="h-3 w-3 hidden sm:block" />
            <span className="sm:hidden">Interface mobile otimizada</span>
            <span className="hidden sm:inline">Interface desktop otimizada</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ConnectionErrorState 