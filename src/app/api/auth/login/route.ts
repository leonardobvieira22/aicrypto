/**
 * API de Login de Usuário - Sistema Profissional
 * Funcionalidades: Validação, Verificação de senha, Sessão, Rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { pbkdf2Sync } from 'crypto'
import { prisma, testDatabaseConnection } from '@/lib/config/database'
import { validateLoginData, sanitizeInput } from '@/lib/validation/auth'

// Configurações
const PBKDF2_ITERATIONS = 100000
const HASH_LENGTH = 64
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

// Interface para resposta da API
interface ApiResponse {
  success: boolean
  message: string
  data?: any
  errors?: string[]
}

// Função para verificar senha
function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(':')
    if (!salt || !hash) return false
    
    const verifyHash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, HASH_LENGTH, 'sha512').toString('hex')
    return hash === verifyHash
  } catch (error) {
    console.error('❌ [LOGIN] Erro ao verificar senha:', error)
    return false
  }
}

// Função para verificar rate limiting
async function checkRateLimit(email: string): Promise<{ allowed: boolean; remainingAttempts?: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        loginAttempts: true,
        lastLoginAttempt: true,
        lockedUntil: true
      }
    })
    
    if (!user) {
      return { allowed: true }
    }
    
    // Verificar se está bloqueado
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { allowed: false, remainingAttempts: 0 }
    }
    
    // Verificar tentativas
    const attempts = user.loginAttempts || 0
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      // Bloquear usuário
      await prisma.user.update({
        where: { email },
        data: {
          lockedUntil: new Date(Date.now() + LOCKOUT_DURATION)
        }
      })
      
      return { allowed: false, remainingAttempts: 0 }
    }
    
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts }
  } catch (error) {
    console.error('❌ [LOGIN] Erro ao verificar rate limit:', error)
    return { allowed: true }
  }
}

// Função para registrar tentativa de login
async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  try {
    if (success) {
      // Reset tentativas em caso de sucesso
      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: 0,
          lastLoginAttempt: new Date(),
          lockedUntil: null,
          lastLogin: new Date()
        }
      })
    } else {
      // Incrementar tentativas em caso de falha
      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: { increment: 1 },
          lastLoginAttempt: new Date()
        }
      })
    }
  } catch (error) {
    console.error('❌ [LOGIN] Erro ao registrar tentativa:', error)
  }
}

// Função principal de login
async function authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: any; message?: string }> {
  try {
    console.log(`🔐 [LOGIN] Tentativa de login para: ${email}`)
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        emailVerified: true
      }
    })
    
    if (!user) {
      console.log(`❌ [LOGIN] Usuário não encontrado: ${email}`)
      return { success: false, message: 'Email ou senha incorretos' }
    }
    
    // Verificar se conta está ativa
    if (!user.isActive) {
      console.log(`❌ [LOGIN] Conta inativa: ${email}`)
      return { success: false, message: 'Conta desativada. Entre em contato com o suporte.' }
    }
    
    // Verificar se email foi verificado
    if (!user.emailVerified) {
      console.log(`❌ [LOGIN] Email não verificado: ${email}`)
      return { success: false, message: 'Email não verificado. Verifique sua caixa de entrada.' }
    }
    
    // Verificar senha
    const passwordValid = verifyPassword(password, user.password)
    if (!passwordValid) {
      console.log(`❌ [LOGIN] Senha incorreta para: ${email}`)
      return { success: false, message: 'Email ou senha incorretos' }
    }
    
    console.log(`✅ [LOGIN] Login bem-sucedido para: ${email}`)
    
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      }
    }
  } catch (error) {
    console.error('❌ [LOGIN] Erro na autenticação:', error)
    return { success: false, message: 'Erro interno do servidor' }
  }
}

// Handler principal da API
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now()
  
  try {
    console.log('🚀 [LOGIN] Iniciando processo de login')
    
    // Testar conexão com banco
    const dbConnected = await testDatabaseConnection()
    if (!dbConnected) {
      console.error('❌ [LOGIN] Falha na conexão com banco de dados')
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor. Tente novamente.'
      }, { status: 500 })
    }
    
    // Obter e sanitizar dados da requisição
    const rawData = await request.json()
    const sanitizedData = sanitizeInput(rawData)
    
    console.log('📝 [LOGIN] Dados recebidos e sanitizados')
    
    // Validar dados
    const validation = validateLoginData(sanitizedData)
    if (!validation.success) {
      console.log('❌ [LOGIN] Dados inválidos:', validation.errors)
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { email, password } = validation.data!
    
    // Verificar rate limiting
    const rateLimit = await checkRateLimit(email)
    if (!rateLimit.allowed) {
      console.log(`❌ [LOGIN] Rate limit excedido para: ${email}`)
      return NextResponse.json({
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
      }, { status: 429 })
    }
    
    // Autenticar usuário
    const authResult = await authenticateUser(email, password)
    
    // Registrar tentativa
    await recordLoginAttempt(email, authResult.success)
    
    if (!authResult.success) {
      const duration = Date.now() - startTime
      console.log(`❌ [LOGIN] Falha na autenticação após ${duration}ms para: ${email}`)
      
      return NextResponse.json({
        success: false,
        message: authResult.message || 'Falha na autenticação'
      }, { status: 401 })
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ [LOGIN] Login concluído em ${duration}ms para: ${email}`)
    
    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: authResult.user
      }
    }, { status: 200 })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ [LOGIN] Erro após ${duration}ms:`, error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor. Tente novamente.'
    }, { status: 500 })
  }
}

// Método não permitido
export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: false,
    message: 'Método não permitido'
  }, { status: 405 })
} 