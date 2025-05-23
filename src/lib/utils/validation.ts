/**
 * Funções utilitárias para validação de dados
 */

/**
 * Valida um CPF
 * @param cpf CPF para validar (pode conter formatação)
 * @returns boolean indicando se o CPF é válido
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Deve ter 11 dígitos
  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Lista de CPFs inválidos conhecidos
  const invalidCPFs = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
    '12345678909'
  ]

  // Verifica se o CPF está na lista de CPFs inválidos
  if (invalidCPFs.includes(cleanCPF)) return false

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

/**
 * Valida formato de CPF (sem verificar dígitos verificadores)
 * Útil para validar o formato antes de enviar ao servidor
 * @param cpf CPF a ser validado (com ou sem formatação)
 * @returns boolean indicando se o formato é válido
 */
export function isValidCPFFormat(cpf: string): boolean {
  // Verifica se é uma string válida
  if (!cpf || typeof cpf !== 'string') return false

  // Verifica o formato com pontos e traço XXX.XXX.XXX-XX
  const formattedRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

  // Verifica o formato apenas com números
  const numbersOnlyRegex = /^\d{11}$/

  return formattedRegex.test(cpf) || numbersOnlyRegex.test(cpf)
}

/**
 * Formata um CPF para exibição (XXX.XXX.XXX-XX)
 * @param cpf CPF para formatar (apenas números)
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  // Remove caracteres não numéricos
  const digits = cpf.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

/**
 * Limpa a formatação de um CPF, deixando apenas números
 * @param cpf CPF formatado
 * @returns CPF sem formatação (apenas números)
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Verifica se um email é válido
 * @param email Email para validar
 * @returns boolean indicando se o email é válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return emailRegex.test(email)
}

/**
 * Verifica se uma data de nascimento indica idade mínima de 18 anos
 * @param dateOfBirth Data de nascimento
 * @returns boolean indicando se a pessoa tem pelo menos 18 anos
 */
export function isAtLeast18YearsOld(dateOfBirth: Date | string): boolean {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  const today = new Date()

  // Calcula idade
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Ajusta idade se ainda não fez aniversário este ano
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age >= 18
}

/**
 * Verifica a força de uma senha
 * @param password Senha para verificar
 * @returns Número de 0 a 5 indicando a força da senha
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0

  // Comprimento básico
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Complexidade
  if (/[A-Z]/.test(password)) score += 1  // Maiúsculas
  if (/[a-z]/.test(password)) score += 1  // Minúsculas
  if (/[0-9]/.test(password)) score += 1  // Números
  if (/[^A-Za-z0-9]/.test(password)) score += 1  // Caracteres especiais

  // Penalidades
  if (/(.)\1{2,}/.test(password)) score -= 1  // Repetições de caracteres
  if (/^(?:password|123456|qwerty)$/i.test(password)) score -= 3  // Senha comum

  // Limitar o score entre 0 e 5
  return Math.max(0, Math.min(5, score))
}

/**
 * Interface para feedback de validação
 */
export interface ValidationFeedback {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

/**
 * Gera feedback para validação de email
 * @param email Email para validar
 * @returns Objeto ValidationFeedback com resultado da validação
 */
export function validateEmailWithFeedback(email: string): ValidationFeedback {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      message: 'Email é obrigatório'
    };
  }

  // Validação básica de formato
  if (!isValidEmail(email)) {
    const suggestions = [];
    
    // Verificar problemas comuns
    if (!email.includes('@')) {
      suggestions.push('Adicione o símbolo @ ao seu email');
    } else if (!email.includes('.')) {
      suggestions.push('O email precisa ter um domínio válido com ponto (exemplo: .com)');
    } else if (email.indexOf('@') === email.lastIndexOf('.') - 1) {
      suggestions.push('Deve haver caracteres entre @ e o ponto');
    } else if (email.lastIndexOf('.') === email.length - 1) {
      suggestions.push('O email não pode terminar com ponto');
    }
    
    return {
      isValid: false,
      message: 'Email inválido',
      suggestions: suggestions.length ? suggestions : ['Verifique se digitou o email corretamente']
    };
  }

  return {
    isValid: true,
    message: 'Email válido'
  };
}

/**
 * Gera feedback para validação de CPF
 * @param cpf CPF para validar
 * @returns Objeto ValidationFeedback com resultado da validação
 */
export function validateCPFWithFeedback(cpf: string): ValidationFeedback {
  const cleanedCPF = cleanCPF(cpf);
  
  if (!cleanedCPF || cleanedCPF.trim() === '') {
    return {
      isValid: false,
      message: 'CPF é obrigatório'
    };
  }
  
  if (cleanedCPF.length !== 11) {
    return {
      isValid: false,
      message: 'CPF deve ter 11 dígitos numéricos',
      suggestions: ['Digite todos os 11 dígitos do CPF']
    };
  }
  
  if (/^(\d)\1{10}$/.test(cleanedCPF)) {
    return {
      isValid: false,
      message: 'CPF inválido (dígitos repetidos)',
      suggestions: ['Os CPFs com todos os dígitos iguais são inválidos']
    };
  }
  
  if (!isValidCPF(cpf)) {
    return {
      isValid: false,
      message: 'CPF inválido',
      suggestions: ['Verifique se digitou corretamente', 'Confira os dígitos verificadores']
    };
  }
  
  return {
    isValid: true,
    message: 'CPF válido'
  };
}

/**
 * Gera feedback para validação de senha
 * @param password Senha para validar
 * @returns Objeto ValidationFeedback com resultado da validação
 */
export function validatePasswordWithFeedback(password: string): ValidationFeedback {
  const strength = calculatePasswordStrength(password);
  const missingRequirements = [];
  
  if (password.length < 8) {
    missingRequirements.push('Adicione mais caracteres (mínimo 8)');
  }
  
  if (!/[A-Z]/.test(password)) {
    missingRequirements.push('Adicione pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    missingRequirements.push('Adicione pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    missingRequirements.push('Adicione pelo menos um número');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    missingRequirements.push('Adicione pelo menos um caractere especial (ex: @, #, $, %)');
  }

  if (/(.)\1{2,}/.test(password)) {
    missingRequirements.push('Evite repetições de caracteres (ex: "aaa")');
  }
  
  if (missingRequirements.length > 0) {
    return {
      isValid: false,
      message: 'Sua senha não atende aos requisitos mínimos de segurança',
      suggestions: missingRequirements
    };
  }
  
  let message = '';
  let isValid = true;
  
  if (strength <= 1) {
    message = 'Senha muito fraca';
    isValid = false;
  } else if (strength <= 3) {
    message = 'Senha razoável, mas pode ser melhorada';
    isValid = true;
  } else {
    message = 'Senha forte';
    isValid = true;
  }
  
  return {
    isValid,
    message,
    suggestions: isValid ? [] : ['Considere adicionar mais variedade de caracteres', 'Uma senha mais longa é mais segura']
  };
}

/**
 * Valida formato de número de telefone brasileiro
 * @param phone Número de telefone
 * @returns boolean indicando se o telefone é válido
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '')
  return /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/.test(cleanPhone)
}

/**
 * Formata um número de telefone brasileiro
 * @param phone Número de telefone (apenas números)
 * @returns Telefone formatado (XX) XXXXX-XXXX
 */
export function formatBrazilianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}
