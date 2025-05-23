import EmailVerificationForm from "@/components/auth/EmailVerificationForm"
import Link from "next/link"
import type { Metadata, Viewport } from 'next'
import { 
  ArrowRight, 
  ShieldCheck, 
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1115' },
  ],
}

export const metadata: Metadata = {
  title: 'Verificar Email - AI Crypto Trading Platform',
  description: 'Verifique seu endereço de email para ativar sua conta na plataforma de trading automatizado com IA',
}

export default function VerifyEmailPage({ searchParams }: { searchParams: { token?: string; email?: string } }) {
  const token = searchParams.token || '';
  const email = searchParams.email || '';

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative">
        <div className="absolute top-6 left-6">
          <Link href="/auth/login" className="inline-flex items-center text-blue-highlight hover:text-blue-medium transition-colors">
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            <span className="text-sm font-medium">Voltar ao Login</span>
          </Link>
        </div>

        <div className="max-w-md w-full space-y-8 mt-12">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-dark to-blue-highlight">
                AI Crypto
              </h2>
            </Link>
            <div className="mt-6 flex justify-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              Verificação de Email
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Verifique seu email para ativar sua conta e começar a usar a plataforma
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start text-sm text-blue-700 dark:text-blue-300">
              <ShieldCheck className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>
                A verificação do email é um passo importante para garantir a segurança da sua conta.
              </p>
            </div>
          </div>

          <EmailVerificationForm token={token} email={email} />

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Benefícios da verificação:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <span className="text-green-500 text-sm mr-2">✓</span>
                  Maior segurança para sua conta
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 text-sm mr-2">✓</span>
                  Acesso a todas as funcionalidades
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 text-sm mr-2">✓</span>
                  Alertas e notificações importantes
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 text-sm mr-2">✓</span>
                  Proteção contra atividades não autorizadas
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
              <div className="flex items-start text-sm text-amber-700 dark:text-amber-300">
                <Clock className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Não recebeu o email?</p>
                  <p>Verifique sua caixa de spam ou lixo eletrônico. O email pode levar alguns minutos para chegar.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já verificou seu email?{" "}
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
    </div>
  )
}
