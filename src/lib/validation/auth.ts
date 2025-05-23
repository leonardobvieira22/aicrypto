/**
 * Sistema de validação profissional para autenticação
 * Validações robustas para produção
 */

// Validação de CPF brasileiro
function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(cleanCPF[9]) !== firstDigit) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  
  return parseInt(cleanCPF[10]) === secondDigit
}

// Validação de idade mínima
function validateAge(birthDate: string): boolean {
  const birth = new Date(birthDate)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18
  }
  
  return age >= 18
}

// Interfaces para validação
interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

// Schema de validação para registro (usando validação manual)
export interface RegisterInput {
  name: string
  email: string
  password: string
  cpf: string
  birthDate: string
  phone?: string
  acceptTerms: boolean
}

// Schema de validação para login
export interface LoginInput {
  email: string
  password: string
}

// Schema para recuperação de senha
export interface ForgotPasswordInput {
  email: string
}

// Schema para redefinição de senha
export interface ResetPasswordInput {
  token: string
  password: string
  confirmPassword: string
}

// Função de validação para registro
export function validateRegisterData(data: any): ValidationResult<RegisterInput> {
  const errors: string[] = []
  
  // Validação do nome
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Nome é obrigatório')
  } else if (data.name.length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres')
  } else if (data.name.length > 100) {
    errors.push('Nome deve ter no máximo 100 caracteres')
  } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(data.name)) {
    errors.push('Nome deve conter apenas letras e espaços')
  }
  
  // Validação do email
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email é obrigatório')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido')
  } else if (data.email.length > 255) {
    errors.push('Email deve ter no máximo 255 caracteres')
  }
  
  // Validação da senha
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Senha é obrigatória')
  } else if (data.password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres')
  } else if (data.password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres')
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(data.password)) {
    errors.push('Senha deve conter: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial')
  }
  
  // Validação do CPF
  if (!data.cpf || typeof data.cpf !== 'string') {
    errors.push('CPF é obrigatório')
  } else if (!validateCPF(data.cpf)) {
    errors.push('CPF inválido')
  }
  
  // Validação da data de nascimento
  if (!data.birthDate || typeof data.birthDate !== 'string') {
    errors.push('Data de nascimento é obrigatória')
  } else {
    const parsedDate = new Date(data.birthDate)
    if (isNaN(parsedDate.getTime()) || parsedDate >= new Date()) {
      errors.push('Data de nascimento inválida')
    } else if (!validateAge(data.birthDate)) {
      errors.push('Você deve ter pelo menos 18 anos')
    }
  }
  
  // Validação do telefone (opcional)
  if (data.phone && typeof data.phone === 'string' && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone)) {
    errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX')
  }
  
  // Validação dos termos
  if (!data.acceptTerms || data.acceptTerms !== true) {
    errors.push('Você deve aceitar os termos de uso')
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return {
    success: true,
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password,
      cpf: data.cpf.replace(/\D/g, ''),
      birthDate: data.birthDate,
      phone: data.phone?.trim(),
      acceptTerms: data.acceptTerms
    }
  }
}

// Função de validação para login
export function validateLoginData(data: any): ValidationResult<LoginInput> {
  const errors: string[] = []
  
  // Validação do email
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email é obrigatório')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido')
  } else if (data.email.length > 255) {
    errors.push('Email deve ter no máximo 255 caracteres')
  }
  
  // Validação da senha
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Senha é obrigatória')
  } else if (data.password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres')
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return {
    success: true,
    data: {
      email: data.email.toLowerCase().trim(),
      password: data.password
    }
  }
}

// Função de validação para recuperação de senha
export function validateForgotPasswordData(data: any): ValidationResult<ForgotPasswordInput> {
  const errors: string[] = []
  
  // Validação do email
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email é obrigatório')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido')
  } else if (data.email.length > 255) {
    errors.push('Email deve ter no máximo 255 caracteres')
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return {
    success: true,
    data: {
      email: data.email.toLowerCase().trim()
    }
  }
}

// Função de validação para redefinição de senha
export function validateResetPasswordData(data: any): ValidationResult<ResetPasswordInput> {
  const errors: string[] = []
  
  // Validação do token
  if (!data.token || typeof data.token !== 'string') {
    errors.push('Token é obrigatório')
  }
  
  // Validação da senha
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Senha é obrigatória')
  } else if (data.password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres')
  } else if (data.password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres')
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(data.password)) {
    errors.push('Senha deve conter: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial')
  }
  
  // Validação da confirmação de senha
  if (!data.confirmPassword || typeof data.confirmPassword !== 'string') {
    errors.push('Confirmação de senha é obrigatória')
  } else if (data.password !== data.confirmPassword) {
    errors.push('Senhas não coincidem')
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return {
    success: true,
    data: {
      token: data.token.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword
    }
  }
}

// Função para sanitizar dados de entrada
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim()
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
} 