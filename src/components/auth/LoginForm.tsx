"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { signIn, getSession } from "next-auth/react"
import { useAuth } from "@/lib/context/AuthContext"
import Link from "next/link"
import { Loader2, Eye, EyeOff, AlertCircle, Mail, RefreshCw } from "lucide-react"
import { AuthDebugPanel } from './AuthDebugPanel'
import { getAuthErrorDetails, AuthAuditor } from '@/lib/utils/authErrors'

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginForm() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormValues>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({})
  const router = useRouter()

  // Validação simples
  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}
    
    if (!formData.email) {
      errors.email = "Email é obrigatório"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido"
    }
    
    if (!formData.password) {
      errors.password = "Senha é obrigatória"
    } else if (formData.password.length < 3) {
      errors.password = "Senha deve ter pelo menos 3 caracteres"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof LoginFormValues, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro específico quando usuário digita
    if (validationErrors[field as 'email' | 'password']) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setAuthError(null)

    // Log da tentativa de login
    AuthAuditor.log({
      action: 'LOGIN_ATTEMPT',
      email: formData.email,
      success: false,
    });

    try {
      const pendingToast = toast.loading("Verificando suas credenciais...")
      const result = await login(formData.email, formData.password)
      toast.dismiss(pendingToast)

      if (result?.success) {
        AuthAuditor.log({
          action: 'LOGIN_SUCCESS',
          email: formData.email,
          success: true,
        });

        toast.success("Login realizado com sucesso!", { duration: 3000 })
        router.push("/dashboard")
        router.refresh()
        return
      }

      if (result?.error) {
        AuthAuditor.log({
          action: 'LOGIN_FAILED',
          email: formData.email,
          errorCode: result.error,
          success: false,
        });

        if (result.error === 'email_not_verified') {
          toast.error('É necessário verificar seu email antes de fazer login.', {
            duration: 5000,
            action: {
              label: "Verificar Email",
              onClick: () => router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
            },
          })
          return
        }

        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Email ou senha incorretos. Verifique suas credenciais.' 
          : result.error
          
        toast.error(errorMessage, { duration: 5000 })
        setAuthError(errorMessage)
        return
      }

      const fallbackError = "Email ou senha incorretos. Verifique suas credenciais.";
      AuthAuditor.log({
        action: 'LOGIN_FAILED',
        email: formData.email,
        errorCode: 'CREDENTIALS_SIGNIN',
        success: false,
      });

      setAuthError(fallbackError)
      toast.error(fallbackError, { duration: 5000 })
    } catch (error: unknown) {
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      
      AuthAuditor.log({
        action: 'LOGIN_ERROR',
        email: formData.email,
        errorCode,
        success: false,
      });

      if ((error as { message?: string })?.message === 'email_not_verified') {
        toast.error('É necessário verificar seu email antes de fazer login.', {
          duration: 5000,
          action: {
            label: "Verificar Email",
            onClick: () => router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
          },
        })
        return
      }
      
      setAuthError("Ocorreu um erro ao fazer login. Tente novamente.")
      toast.error("Ocorreu um erro ao fazer login. Tente novamente.", { duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      toast.error("Erro ao fazer login com Google. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true)
      await signIn("github", { callbackUrl: "/dashboard" })
    } catch (error) {
      toast.error("Erro ao fazer login com GitHub. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (demoEmail: string, demoPassword: string) => {
    setFormData({
      email: demoEmail,
      password: demoPassword,
      rememberMe: false
    })
    setAuthError(null)
    setValidationErrors({})
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simular submit criando dados diretos
    setIsLoading(true)
    setAuthError(null)

    // Log da tentativa de login
    AuthAuditor.log({
      action: 'LOGIN_ATTEMPT',
      email: demoEmail,
      success: false,
    });

    try {
      const pendingToast = toast.loading("Verificando suas credenciais...")
      const result = await login(demoEmail, demoPassword)
      toast.dismiss(pendingToast)

      if (result?.success) {
        AuthAuditor.log({
          action: 'LOGIN_SUCCESS',
          email: demoEmail,
          success: true,
        });

        toast.success("Login realizado com sucesso!", { duration: 3000 })
        router.push("/dashboard")
        router.refresh()
        return
      }

      if (result?.error) {
        AuthAuditor.log({
          action: 'LOGIN_FAILED',
          email: demoEmail,
          errorCode: result.error,
          success: false,
        });

        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Email ou senha incorretos. Verifique suas credenciais.' 
          : result.error
          
        toast.error(errorMessage, { duration: 5000 })
        setAuthError(errorMessage)
        return
      }

      const fallbackError = "Email ou senha incorretos. Verifique suas credenciais.";
      AuthAuditor.log({
        action: 'LOGIN_FAILED',
        email: demoEmail,
        errorCode: 'CREDENTIALS_SIGNIN',
        success: false,
      });

      setAuthError(fallbackError)
      toast.error(fallbackError, { duration: 5000 })
    } catch (error: unknown) {
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      
      AuthAuditor.log({
        action: 'LOGIN_ERROR',
        email: demoEmail,
        errorCode,
        success: false,
      });
      
      setAuthError("Ocorreu um erro ao fazer login. Tente novamente.")
      toast.error("Ocorreu um erro ao fazer login. Tente novamente.", { duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  const renderErrorMessage = () => {
    if (!authError) return null

    const errorDetails = getAuthErrorDetails(authError)
    
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-fadeIn mb-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">{errorDetails.title}</div>
            <div className="text-sm mt-1">{errorDetails.message}</div>
            <div className="text-xs text-muted-foreground mt-1">{errorDetails.suggestion}</div>
            
            <div className="flex gap-2 mt-3 flex-wrap">
              {authError === 'email_not_verified' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Reenviar email de verificação')}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Reenviar Email
                </Button>
              )}
              
              {(authError === 'INVALID_PASSWORD' || authError === 'CredentialsSignin' || authError.includes('senha')) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/auth/forgot-password')}
                >
                  Esqueci Minha Senha
                </Button>
              )}
              
              {authError === 'USER_NOT_FOUND' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/auth/register')}
                >
                  Criar Conta
                </Button>
              )}
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAuthError('')
                  setFormData({
                    email: "",
                    password: "",
                    rememberMe: false,
                  })
                  setValidationErrors({})
                }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AuthDebugPanel />
      {renderErrorMessage()}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-base font-medium text-gray-900 dark:text-gray-100">
            Email
          </label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`focus-visible:ring-primary h-11 transition-all duration-200 ${
              validationErrors.email ? 'border-red-500' : ''
            }`}
            disabled={isLoading}
          />
          {validationErrors.email && (
            <p className="text-xs text-red-500">{validationErrors.email}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium text-gray-900 dark:text-gray-100">
            Senha
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`focus-visible:ring-primary h-11 pr-10 transition-all duration-200 ${
                validationErrors.password ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {validationErrors.password && (
            <p className="text-xs text-red-500">{validationErrors.password}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            checked={formData.rememberMe}
            onCheckedChange={(checked) => handleInputChange('rememberMe', checked)}
            className="mt-1"
          />
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Manter-me conectado
          </label>
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full py-6 font-medium bg-blue-highlight hover:bg-blue-700 text-white transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">Login rápido para demonstração:</p>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleQuickLogin('demo@example.com', 'demo123')}
                disabled={isLoading}
              >
                👤 Usuário Demo (demo@example.com)
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="h-12 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="h-12 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary">
              Registre-se
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link href="/auth/forgot-password" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
            Esqueceu sua senha?
          </Link>
        </div>
      </form>
    </div>
  )
}
