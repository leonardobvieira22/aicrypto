"use client"

import { useBinance } from "@/lib/context/BinanceContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Database, Settings, User, Shield } from "lucide-react"
import { toast } from "sonner"

export default function BinanceConnectionStatus() {
  const { isMasterConnected, isConnecting, hasUserApi, userApiConnected } = useBinance()

  const getMasterStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: <Settings className="h-3 w-3 animate-spin" />,
        text: "Conectando...",
        variant: "secondary" as const,
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      }
    }

    if (isMasterConnected) {
      return {
        icon: <Wifi className="h-3 w-3" />,
        text: "Dados Reais",
        variant: "default" as const,
        className: "bg-green-500/20 text-green-400 border-green-500/30"
      }
    }

    return {
      icon: <WifiOff className="h-3 w-3" />,
      text: "Sem Conexão",
      variant: "destructive" as const,
      className: "bg-red-500/20 text-red-400 border-red-500/30"
    }
  }

  const getUserStatusInfo = () => {
    if (!hasUserApi) {
      return {
        icon: <User className="h-3 w-3" />,
        text: "API não configurada",
        variant: "outline" as const,
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30"
      }
    }

    if (userApiConnected) {
      return {
        icon: <Shield className="h-3 w-3" />,
        text: "API do usuário OK",
        variant: "default" as const,
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30"
      }
    }

    return {
      icon: <User className="h-3 w-3" />,
      text: "API configurada",
      variant: "outline" as const,
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const masterStatus = getMasterStatusInfo()
  const userStatus = getUserStatusInfo()

  return (
    <div className="flex items-center space-x-2">
      {/* Status da API Mãe (dados do gráfico) */}
      <Badge 
        variant={masterStatus.variant}
        className={`${masterStatus.className} text-xs flex items-center space-x-1`}
      >
        {masterStatus.icon}
        <span>{masterStatus.text}</span>
      </Badge>
      
      {/* Status da API do Usuário (funcionalidades futuras) */}
      <Badge 
        variant={userStatus.variant}
        className={`${userStatus.className} text-xs flex items-center space-x-1`}
      >
        {userStatus.icon}
        <span>{userStatus.text}</span>
      </Badge>
      
      {!hasUserApi && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-gray-300"
          onClick={() => {
            toast.info("Configuração da API do Usuário", {
              description: "Configure sua API pessoal da Binance para funcionalidades futuras como trading automático.",
              action: {
                label: "Configurar",
                onClick: () => {
                  console.log("Navegar para configurações")
                }
              }
            })
          }}
        >
          Configurar API Pessoal
        </Button>
      )}
    </div>
  )
} 