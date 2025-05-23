"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Loader2, Check, X, Info, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

// Validação de CPF
function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Deve ter 11 dígitos
  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let mod = sum % 11
  const digit1 = mod < 2 ? 0 : 11 - mod

  if (Number.parseInt(cleanCPF.charAt(9)) !== digit1) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  mod = sum % 11
  const digit2 = mod < 2 ? 0 : 11 - mod

  return Number.parseInt(cleanCPF.charAt(10)) === digit2
}

// Formatação de CPF (XXX.XXX.XXX-XX)
function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

// Validação de email
function isValidEmail(email: string): boolean {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

// Validação de nome
function isValidName(name: string): boolean {
  if (!name || name.length < 3) return false
  return /^[a-zA-ZÀ-ÿ\s]+$/.test(name)
}

// Validação de data de nascimento
function isValidDateOfBirth(date: string): boolean {
  if (!date) return false
  const birthDate = new Date(date)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Verifica se tem pelo menos 18 anos
  if (age < 18 || (age === 18 && monthDiff < 0)) {
    return false
  }

  // Verifica se a data não é no futuro e não é muito antiga (mais de 120 anos)
  return birthDate <= today && age <= 120
}

// Validação de senha
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!password) {
    errors.push('Senha é obrigatória')
    return { isValid: false, errors }
  }
  
  if (password.length < 8) errors.push('Senha deve ter pelo menos 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Senha deve conter pelo menos uma letra maiúscula')
  if (!/[a-z]/.test(password)) errors.push('Senha deve conter pelo menos uma letra minúscula')
  if (!/[0-9]/.test(password)) errors.push('Senha deve conter pelo menos um número')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Senha deve conter pelo menos um caractere especial')
  
  return { isValid: errors.length === 0, errors }
}

// Função para calcular a força da senha
function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Comprimento básico
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Complexidade
  if (/[A-Z]/.test(password)) score += 1;  // Maiúsculas
  if (/[a-z]/.test(password)) score += 1;  // Minúsculas
  if (/[0-9]/.test(password)) score += 1;  // Números
  if (/[^A-Za-z0-9]/.test(password)) score += 1;  // Caracteres especiais

  // Penalidades
  if (/(.)\1{2,}/.test(password)) score -= 1;  // Repetições de caracteres
  if (/^(?:password|123456|qwerty)$/i.test(password)) score -= 3;  // Senha comum

  // Limitar o score entre 0 e 5
  return Math.max(0, Math.min(5, score));
}

function getStrengthText(strength: number): { text: string; color: string } {
  switch (strength) {
    case 0:
      return { text: "Muito fraca", color: "text-red-500" };
    case 1:
      return { text: "Fraca", color: "text-red-500" };
    case 2:
      return { text: "Razoável", color: "text-yellow-500" };
    case 3:
      return { text: "Média", color: "text-yellow-500" };
    case 4:
      return { text: "Forte", color: "text-green-500" };
    case 5:
      return { text: "Muito forte", color: "text-green-500" };
    default:
      return { text: "", color: "" };
  }
}

// Interface para os dados do formulário de registro
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  dateOfBirth: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

// Interface para erros de validação
interface FormErrors {
  [key: string]: string;
}

// Interface para o estado dos passos do registro
interface RegistrationSteps {
  basicInfo: boolean;
  emailValid: boolean;
  cpfValid: boolean;
  passwordValid: boolean;
  termsAccepted: boolean;
}

export default function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationSteps, setRegistrationSteps] = useState<RegistrationSteps>({
    basicInfo: false,
    emailValid: false,
    cpfValid: false,
    passwordValid: false,
    termsAccepted: false
  })

  // Estado do formulário
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    dateOfBirth: '',
    termsAccepted: false,
    privacyAccepted: false
  })

  // Estado dos erros
  const [errors, setErrors] = useState<FormErrors>({})

  // Função para validar um campo específico
  const validateField = useCallback((name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!isValidName(value)) {
          if (!value) return 'Nome é obrigatório'
          if (value.length < 3) return 'Nome deve ter pelo menos 3 caracteres'
          return 'Nome deve conter apenas letras e espaços'
        }
        return ''
        
      case 'email':
        if (!isValidEmail(value)) {
          if (!value) return 'Email é obrigatório'
          return 'Email inválido'
        }
        return ''
        
      case 'password':
        const passwordValidation = validatePassword(value)
        return passwordValidation.isValid ? '' : passwordValidation.errors[0]
        
      case 'confirmPassword':
        if (value !== formData.password) {
          return 'As senhas não coincidem'
        }
        return ''
        
      case 'cpf':
        if (!value) return 'CPF é obrigatório'
        if (!isValidCPF(value.replace(/\D/g, ''))) {
          return 'CPF inválido'
        }
        return ''
        
      case 'dateOfBirth':
        if (!isValidDateOfBirth(value)) {
          if (!value) return 'Data de nascimento é obrigatória'
          return 'Você deve ter pelo menos 18 anos para se registrar'
        }
        return ''
        
      case 'termsAccepted':
        return value === true ? '' : 'Você deve aceitar os termos e condições'
        
      case 'privacyAccepted':
        return value === true ? '' : 'Você deve aceitar a política de privacidade'
        
      default:
        return ''
    }
  }, [formData.password])

  // Função para atualizar o campo do formulário
  const updateField = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validar o campo em tempo real
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
    
    // Atualizar força da senha se necessário
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
    
    // Atualizar passos do registro
    updateRegistrationSteps(name, value)
  }, [validateField])

  // Atualizar passos do registro
  const updateRegistrationSteps = useCallback((name: string, value: any) => {
    setRegistrationSteps(prev => {
      const newSteps = { ...prev }
      
      switch (name) {
        case 'name':
          newSteps.basicInfo = isValidName(value)
          break
        case 'email':
          newSteps.emailValid = isValidEmail(value)
          break
        case 'cpf':
          newSteps.cpfValid = isValidCPF(value.replace(/\D/g, ''))
          break
        case 'password':
          const strength = calculatePasswordStrength(value)
          newSteps.passwordValid = strength >= 3
          break
        case 'termsAccepted':
        case 'privacyAccepted':
          newSteps.termsAccepted = formData.termsAccepted && formData.privacyAccepted
          break
      }
      
      return newSteps
    })
  }, [formData.termsAccepted, formData.privacyAccepted])

  // Validar todo o formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof RegisterFormData])
      if (error) newErrors[key] = error
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  // Calcular progresso do registro
  const calculateProgress = useCallback(() => {
    const steps = Object.values(registrationSteps)
    const completedSteps = steps.filter(Boolean).length
    return (completedSteps / steps.length) * 100
  }, [registrationSteps])

  // Função para formatar o CPF enquanto o usuário digita
  const handleCPFChange = useCallback((value: string) => {
    const formatted = formatCPF(value)
    updateField('cpf', formatted)
  }, [updateField])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setRegisterError(null)

    try {
      // Enviar requisição diretamente para API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          cpf: formData.cpf.replace(/\D/g, ''), // Remover formatação
          dateOfBirth: formData.dateOfBirth,
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.privacyAccepted,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar usuário')
      }

      // Registro bem-sucedido
      toast.success('Conta criada com sucesso!', {
        description: 'Verifique seu email para ativar sua conta.'
      })
      
      // Redirecionar para página de verificação de email
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (error: any) {
      console.error('Erro no registro:', error)
      const errorMessage = error?.message || 'Erro ao criar conta. Tente novamente.'
      setRegisterError(errorMessage)
      toast.error('Erro no cadastro', {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const strengthInfo = getStrengthText(passwordStrength)

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {registerError && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm animate-fadeIn">
          <div className="flex items-start">
            <X className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>{registerError}</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progresso do Cadastro</span>
          <span className="text-xs font-medium">{Math.round(calculateProgress())}%</span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Nome Completo</label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="João Silva"
            className={cn(
              "transition-all duration-200",
              errors.name && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="seu@email.com"
            className={cn(
              "transition-all duration-200",
              errors.email && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium mb-2">CPF</label>
          <Input
            id="cpf"
            type="text"
            value={formData.cpf}
            onChange={(e) => handleCPFChange(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className={cn(
              "transition-all duration-200",
              errors.cpf && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">Data de Nascimento</label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            max={(() => {
              const date = new Date()
              date.setFullYear(date.getFullYear() - 18)
              return date.toISOString().split('T')[0]
            })()}
            className={cn(
              "transition-all duration-200",
              errors.dateOfBirth && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">Senha</label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="********"
              className={cn(
                "transition-all duration-200 pr-10",
                errors.password && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span>Força da senha:</span>
                <span className={strengthInfo.color}>{strengthInfo.text}</span>
              </div>
              <Progress value={(passwordStrength / 5) * 100} className="h-1 mt-1" />
            </div>
          )}
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirmar Senha</label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="********"
              className={cn(
                "transition-all duration-200 pr-10",
                errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="termsAccepted"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => updateField('termsAccepted', checked)}
              className={cn(
                "mt-1",
                errors.termsAccepted && "border-red-500"
              )}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="termsAccepted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito os{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Termos e Condições
                </Link>
              </label>
              {errors.termsAccepted && <p className="text-red-500 text-xs">{errors.termsAccepted}</p>}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacyAccepted"
              checked={formData.privacyAccepted}
              onCheckedChange={(checked) => updateField('privacyAccepted', checked)}
              className={cn(
                "mt-1",
                errors.privacyAccepted && "border-red-500"
              )}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="privacyAccepted"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito a{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Política de Privacidade
                </Link>
              </label>
              {errors.privacyAccepted && <p className="text-red-500 text-xs">{errors.privacyAccepted}</p>}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar Conta"
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </form>
  )
}
