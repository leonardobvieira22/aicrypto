import Link from "next/link"
import { Button } from "@/components/ui/button"
import RegisterForm from "@/components/auth/RegisterForm"
import type { Metadata, Viewport } from 'next'
import { 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Lock, 
  BarChart3, 
  Bot, 
  RefreshCw, 
  Award, 
  TrendingUp,
  Zap,
  SmartphoneCharging,
  Globe
} from "lucide-react"

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1115' },
  ],
}

export const metadata: Metadata = {
  title: 'Registro - AI Crypto Trading Platform',
  description: 'Registre-se para começar a usar o trading automatizado com IA',
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Panel - Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 md:p-8 relative">
          <div className="absolute top-6 left-6">
            <Link href="/" className="inline-flex items-center text-blue-highlight hover:text-blue-medium transition-colors">
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
          </div>

          <div className="max-w-md w-full space-y-8 mt-12">
            <div className="text-center">
              <Link href="/" className="inline-block">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-dark to-blue-highlight">
                  AI Crypto
                </h2>
              </Link>
              <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                Crie sua conta
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Registre-se para começar a usar o trading automatizado com IA
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start text-sm text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <p>
                  Seus dados estão protegidos com criptografia de ponta a ponta. 
                  Nunca compartilhamos suas informações pessoais com terceiros.
                </p>
              </div>
            </div>

            <RegisterForm />

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Já tem uma conta?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-highlight hover:text-blue-medium"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center text-xs text-gray-500 dark:text-gray-400">
            <Link href="/terms" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">Termos de Uso</Link>
            <div className="hidden sm:block">•</div>
            <Link href="/privacy" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">Política de Privacidade</Link>
            <div className="hidden sm:block">•</div>
            <Link href="/help" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">Central de Ajuda</Link>
          </div>
        </div>

        {/* Right Panel - Modern Design with Gradient */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden">
          {/* Background Gradient */}
        <div
            className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"
          style={{
              backgroundSize: '400% 400%',
              animation: 'gradient-animation 15s ease infinite',
            }}
          />
          
          {/* Decorative Circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-400 opacity-20 blur-3xl"></div>
          <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-purple-500 opacity-10 blur-3xl"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-center items-center p-12 text-white">
            <div className="max-w-lg">
              {/* Floating Icons */}
              <div className="absolute top-24 left-12 animate-float-slow">
                <BarChart3 className="h-10 w-10 text-blue-200 opacity-50" />
              </div>
              <div className="absolute bottom-36 right-24 animate-float-medium">
                <RefreshCw className="h-8 w-8 text-purple-200 opacity-50" />
              </div>
              <div className="absolute top-48 right-16 animate-float-fast">
                <TrendingUp className="h-9 w-9 text-indigo-200 opacity-50" />
              </div>
              <div className="absolute bottom-72 left-20 animate-float-medium">
                <Zap className="h-7 w-7 text-blue-100 opacity-50" />
              </div>
              
              {/* Main Content */}
              <h2 className="text-4xl font-bold mb-6 relative z-10">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Trading inteligente e automatizado
                </span>
              </h2>
              
              <p className="text-lg mb-10 text-blue-50">
                Nossa plataforma combina inteligência artificial avançada com algoritmos de trading para operar 24/7 com eficiência máxima.
            </p>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="glassmorphism-card flex flex-col items-center text-center p-6 transition-all duration-300 hover:scale-105">
                  <div className="bg-blue-500/30 p-3 rounded-xl mb-4">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-medium text-white mb-2">Robôs de IA</h3>
                  <p className="text-xs text-blue-100">Algoritmos inteligentes que aprendem e se adaptam às condições do mercado</p>
                </div>
                
                <div className="glassmorphism-card flex flex-col items-center text-center p-6 transition-all duration-300 hover:scale-105">
                  <div className="bg-indigo-500/30 p-3 rounded-xl mb-4">
                    <SmartphoneCharging className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-medium text-white mb-2">App Mobile</h3>
                  <p className="text-xs text-blue-100">Acompanhe suas operações e resultados de qualquer lugar</p>
                </div>
                
                <div className="glassmorphism-card flex flex-col items-center text-center p-6 transition-all duration-300 hover:scale-105">
                  <div className="bg-purple-500/30 p-3 rounded-xl mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-medium text-white mb-2">Performance</h3>
                  <p className="text-xs text-blue-100">Retornos simulados de 4-7% ao mês com estratégias diversificadas</p>
                </div>
                
                <div className="glassmorphism-card flex flex-col items-center text-center p-6 transition-all duration-300 hover:scale-105">
                  <div className="bg-blue-600/30 p-3 rounded-xl mb-4">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-medium text-white mb-2">Global</h3>
                  <p className="text-xs text-blue-100">Opere em múltiplos mercados e criptomoedas simultaneamente</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="glassmorphism-card border border-white/10 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="h-3 w-3 bg-red-400 rounded-full mr-2"></div>
                    <div className="h-3 w-3 bg-yellow-400 rounded-full mr-2"></div>
                    <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                  </div>
                  <code className="text-xs text-blue-100 font-mono">
                    <div className="mb-1">$ AI-Crypto initialized</div>
                    <div className="mb-1">$ Connecting to exchanges...</div>
                    <div className="mb-1">$ Markets: BTC, ETH, BNB ready</div>
                    <div className="mb-1">$ AI analysis complete</div>
                    <div className="text-green-300">$ Auto-trading enabled |</div>
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
