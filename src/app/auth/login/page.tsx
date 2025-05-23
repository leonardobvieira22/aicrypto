import Link from "next/link"
import { Button } from "@/components/ui/button"
import LoginForm from "@/components/auth/LoginForm"
import type { Metadata, Viewport } from 'next'
import { 
  ArrowRight, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Cpu,
  RefreshCw, 
  Lock,
  LineChart
} from "lucide-react"

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1115' },
  ],
}

export const metadata: Metadata = {
  title: 'Login - AI Crypto Trading Platform',
  description: 'Acesse sua conta para começar a usar o trading automatizado com IA',
}

export default function LoginPage() {
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
                Entre na sua conta
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Acesse sua conta para começar a usar o trading automatizado com IA
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start text-sm text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <p>
                  Acesso seguro com criptografia de ponta a ponta.
                  Seus dados estão protegidos em nossa plataforma.
                </p>
              </div>
            </div>

            <LoginForm />

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Não tem uma conta?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-blue-highlight hover:text-blue-medium"
                >
                  Registre-se agora
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

        {/* Right Panel - Modern Gradient Design */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden">
          {/* Background Gradient */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800"
            style={{ 
              backgroundSize: '400% 400%',
              animation: 'gradient-animation 15s ease infinite',
            }}
          />
          
          {/* Decorative Circles */}
          <div className="absolute top-24 -right-24 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-400 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-64 -right-16 w-64 h-64 rounded-full bg-indigo-500 opacity-10 blur-3xl"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-center items-center p-12 text-white">
            {/* Floating Icons */}
            <div className="absolute top-24 left-12 animate-float-slow">
              <BarChart3 className="h-10 w-10 text-blue-200 opacity-50" />
            </div>
            <div className="absolute bottom-36 right-20 animate-float-medium">
              <LineChart className="h-8 w-8 text-purple-200 opacity-50" />
            </div>
            <div className="absolute top-48 right-16 animate-float-fast">
              <TrendingUp className="h-9 w-9 text-indigo-200 opacity-50" />
            </div>
            <div className="absolute bottom-72 left-20 animate-float-medium">
              <Zap className="h-7 w-7 text-blue-100 opacity-50" />
            </div>
            
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold mb-6 relative z-10">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Maximize seus lucros com IA
                </span>
              </h2>
              
              <p className="text-lg mb-8 text-blue-50">
                Nossa plataforma utiliza algoritmos avançados de IA para analisar o mercado e executar trades com precisão.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="glassmorphism-card p-6 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-500/30 p-2 rounded-lg mr-3">
                      <Cpu className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl">+5.000</h3>
                  </div>
                  <p className="text-sm text-blue-100">Traders ativos utilizando nossa plataforma</p>
                </div>
                
                <div className="glassmorphism-card p-6 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center mb-3">
                    <div className="bg-indigo-500/30 p-2 rounded-lg mr-3">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl">4-7%</h3>
                  </div>
                  <p className="text-sm text-blue-100">Retorno mensal simulado em média</p>
                </div>
                
                <div className="glassmorphism-card p-6 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center mb-3">
                    <div className="bg-purple-500/30 p-2 rounded-lg mr-3">
                      <RefreshCw className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl">120+</h3>
                  </div>
                  <p className="text-sm text-blue-100">Pares de trading disponíveis para operar</p>
                </div>
                
                <div className="glassmorphism-card p-6 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-600/30 p-2 rounded-lg mr-3">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl">99.9%</h3>
                  </div>
                  <p className="text-sm text-blue-100">Uptime garantido em nossa infraestrutura</p>
                </div>
              </div>
              
              {/* Gráfico simulado */}
              <div className="glassmorphism-card mb-6 p-5 border border-white/10 relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="bg-purple-400/20 p-1.5 rounded mr-2">
                      <LineChart className="h-4 w-4 text-purple-200" />
                    </div>
                    <span className="text-sm font-medium text-blue-50">Performance BTC/USDT</span>
                  </div>
                  <span className="text-xs text-green-300">+12.4%</span>
                </div>
                
                <div className="h-20 flex items-end space-x-1">
                  {[40, 25, 38, 52, 65, 58, 72, 80, 75, 85, 92, 88, 95].map((height, i) => (
                    <div 
                      key={i} 
                      className="bg-gradient-to-t from-purple-500/40 to-blue-400/40 rounded-sm w-full"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
