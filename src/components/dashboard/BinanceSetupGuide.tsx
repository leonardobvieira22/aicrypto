"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBinance } from "@/lib/context/BinanceContext"
import { ExternalLink, Eye, EyeOff, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"

export default function BinanceSetupGuide() {
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setUserCredentials, hasUserApi, isMasterConnected } = useBinance()

  if (hasUserApi) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast.error("Erro", {
        description: "Por favor, preencha ambas as chaves da API."
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const success = await setUserCredentials(apiKey.trim(), apiSecret.trim())
      if (success) {
        setApiKey("")
        setApiSecret("")
        toast.success("Sucesso!", {
          description: "API pessoal configurada! Suas credenciais estão prontas para funcionalidades futuras."
        })
      }
    } catch (error) {
      console.error("Erro ao configurar API:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <span>🔧 Configure sua API Pessoal da Binance</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Configure suas credenciais pessoais para funcionalidades futuras como trading automático
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Informação:</p>
              <p className="text-xs">
                Os dados do gráfico já vêm da nossa API principal. 
                Esta configuração é para funcionalidades futuras como trading automático com sua conta.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-200">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="space-y-1 text-xs">
                <li>• Configure as permissões para "Spot & Margin Trading"</li>
                <li>• Suas chaves ficam armazenadas apenas no seu navegador</li>
                <li>• Nunca compartilhe suas chaves da API</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">1. Criar chaves da API na Binance</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              onClick={() => window.open("https://www.binance.com/en/my/settings/api-management", "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir Binance
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="apiKey" className="text-sm text-gray-300">API Key</Label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua API Key pessoal aqui"
                className="bg-gray-800/50 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="apiSecret" className="text-sm text-gray-300">Secret Key</Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showSecret ? "text" : "password"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Cole sua Secret Key pessoal aqui"
                  className="bg-gray-800/50 border-gray-600 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-400 hover:text-gray-300"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !apiKey.trim() || !apiSecret.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Configurando..." : "Salvar API Pessoal"}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-gray-300"
              onClick={() => {
                toast.info("API Pessoal", {
                  description: "Esta configuração é opcional e será usada para funcionalidades futuras."
                })
              }}
            >
              Pular por enquanto
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 