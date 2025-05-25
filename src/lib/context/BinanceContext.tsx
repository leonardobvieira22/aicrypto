"use client"

import type React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import { BinanceService } from '@/lib/services/binance'
import { toast } from 'sonner'
import { getMasterBinanceCredentials, getUserBinanceCredentials, hasUserCredentials } from '@/lib/config/api-keys'
import { useAuth } from '@/lib/context/AuthContext'

// Função auxiliar para verificar se estamos no cliente
const isClient = () => typeof window !== 'undefined'

type BinanceContextType = {
  // Serviço principal (sempre usa credenciais mãe para dados)
  binanceService: BinanceService
  isMasterConnected: boolean
  isConnecting: boolean
  
  // Credenciais do usuário (para funcionalidades futuras)
  hasUserApi: boolean
  userApiConnected: boolean
  
  // Funções
  setUserCredentials: (apiKey: string, apiSecret: string) => Promise<boolean>
  clearUserCredentials: () => void
  testUserConnection: () => Promise<boolean>
}

const BinanceContext = createContext<BinanceContextType | undefined>(undefined)

export const BinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Serviço principal sempre usa credenciais mãe
  const [binanceService] = useState(() => {
    const service = new BinanceService()
    const masterCreds = getMasterBinanceCredentials()
    service.setCredentials(masterCreds.apiKey, masterCreds.apiSecret)
    return service
  })
  
  const [isMasterConnected, setIsMasterConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasUserApi, setHasUserApi] = useState(false)
  const [userApiConnected, setUserApiConnected] = useState(false)
  const { isAuthenticated } = useAuth()

  // Inicializar conexão com API mãe
  useEffect(() => {
    const initializeMasterConnection = async () => {
      setIsConnecting(true)
      try {
        // Testar conexão com credenciais mãe
        const pingSuccess = await binanceService.ping()
        
        if (pingSuccess) {
          // Testar com requisição real
          const klineData = await binanceService.getKlines('BTCUSDT', '1m', 1)
          setIsMasterConnected(true)
          console.log('✅ Conexão com API mãe da Binance estabelecida - dados reais disponíveis')
        } else {
          throw new Error('Falha no ping da API')
        }
      } catch (error) {
        console.error('❌ Erro ao conectar com API mãe da Binance:', error)
        setIsMasterConnected(false)
        toast.error('Erro de Conexão', {
          description: 'Não foi possível conectar com a API da Binance. Verifique a configuração.'
        })
      } finally {
        setIsConnecting(false)
      }
    }

    initializeMasterConnection()
  }, [binanceService])

  // Verificar credenciais do usuário
  useEffect(() => {
    if (isAuthenticated) {
      setHasUserApi(hasUserCredentials())
    } else {
      setHasUserApi(false)
      setUserApiConnected(false)
    }
  }, [isAuthenticated])

  // Configurar credenciais do usuário (para funcionalidades futuras)
  const setUserCredentials = async (apiKey: string, apiSecret: string): Promise<boolean> => {
    if (!isClient()) {
      console.warn('[BINANCE] Tentativa de salvar credenciais no servidor ignorada')
      return false
    }

    try {
      // Salvar no localStorage
      localStorage.setItem('user_binance_api_key', apiKey)
      localStorage.setItem('user_binance_api_secret', apiSecret)
      
      setHasUserApi(true)
      
      // Testar conexão (opcional - para validar as credenciais)
      const isValid = await testUserConnection()
      
      if (isValid) {
        toast.success("Credenciais do usuário salvas", {
          description: "Suas credenciais da Binance foram configuradas para funcionalidades futuras."
        })
      }
      
      return isValid
    } catch (error) {
      console.error('Erro ao configurar credenciais do usuário:', error)
      toast.error("Erro", {
        description: "Não foi possível salvar as credenciais do usuário."
      })
      return false
    }
  }

  // Limpar credenciais do usuário
  const clearUserCredentials = () => {
    if (!isClient()) {
      console.warn('[BINANCE] Tentativa de limpar credenciais no servidor ignorada')
      return
    }

    localStorage.removeItem('user_binance_api_key')
    localStorage.removeItem('user_binance_api_secret')
    setHasUserApi(false)
    setUserApiConnected(false)
    
    toast.info("Credenciais removidas", {
      description: "Suas credenciais pessoais da Binance foram removidas."
    })
  }

  // Testar conexão com credenciais do usuário
  const testUserConnection = async (): Promise<boolean> => {
    const userCreds = getUserBinanceCredentials()
    if (!userCreds) {
      setUserApiConnected(false)
      return false
    }

    try {
      // Criar serviço temporário para testar credenciais do usuário
      const testService = new BinanceService()
      testService.setCredentials(userCreds.apiKey, userCreds.apiSecret)
      
      const pingSuccess = await testService.ping()
      setUserApiConnected(pingSuccess)
      
      return pingSuccess
    } catch (error) {
      console.error('Erro ao testar credenciais do usuário:', error)
      setUserApiConnected(false)
      return false
    }
  }

  return (
    <BinanceContext.Provider
      value={{
        binanceService,
        isMasterConnected,
        isConnecting,
        hasUserApi,
        userApiConnected,
        setUserCredentials,
        clearUserCredentials,
        testUserConnection
      }}
    >
      {children}
    </BinanceContext.Provider>
  )
}

export const useBinance = (): BinanceContextType => {
  const context = useContext(BinanceContext)
  if (!context) {
    throw new Error('useBinance must be used within a BinanceProvider')
  }
  return context
}
