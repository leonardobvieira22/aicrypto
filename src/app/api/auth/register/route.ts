/**
 * API de Registro de Usuário - Sistema Profissional
 * Funcionalidades: Validação, Hash de senha, Criação de dados relacionados, Email
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes, pbkdf2Sync } from 'crypto'
import { prisma, testDatabaseConnection } from '@/lib/config/database'
import { validateRegisterData, sanitizeInput } from '@/lib/validation/auth'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/services/email'

// Configurações
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 32
const HASH_LENGTH = 64
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 horas

// Interface para resposta da API
interface ApiResponse {
  success: boolean
  message: string
  data?: any
  errors?: string[]
}

// Função para hash de senha usando PBKDF2
function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, HASH_LENGTH, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// Função para gerar token de verificação
function generateVerificationToken(): string {
  return randomBytes(32).toString('hex') + Date.now().toString(36)
}

// Função para criar URL de verificação
function createVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://main.d34l4lklofiz4e.amplifyapp.com'
  return `${baseUrl}/auth/verify-email?token=${token}`
}

// Função para verificar se email já existe
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })
    return !!user
  } catch (error) {
    console.error('❌ [REGISTER] Erro ao verificar email:', error)
    return false
  }
}

// Função para verificar se CPF já existe
async function checkCpfExists(cpf: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { cpf },
      select: { id: true }
    })
    return !!user
  } catch (error) {
    console.error('❌ [REGISTER] Erro ao verificar CPF:', error)
    return false
  }
}

// Função para criar configurações padrão do usuário
async function createUserDefaults(userId: string): Promise<void> {
  try {
    console.log(`🔧 [REGISTER] Criando configurações padrão para usuário: ${userId}`)
    
    // Criar configurações de trading
    await prisma.tradingSetting.create({
      data: {
        userId,
        riskLevel: 'MEDIUM',
        maxDailyLoss: 100.0,
        maxPositionSize: 1000.0,
        stopLossPercentage: 5.0,
        takeProfitPercentage: 10.0,
        tradingPairs: ['BTCUSDT', 'ETHUSDT'],
        isActive: false
      }
    })
    
    // Criar carteira de paper trading
    await prisma.paperTradingWallet.create({
      data: {
        userId,
        balance: 10000.0,
        currency: 'USDT'
      }
    })
    
    // Criar preferências de notificação
    await prisma.notificationPreferences.create({
      data: {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        tradingAlerts: true,
        marketUpdates: false,
        weeklyReports: true
      }
    })
    
    console.log('✅ [REGISTER] Configurações padrão criadas com sucesso')
  } catch (error) {
    console.error('❌ [REGISTER] Erro ao criar configurações padrão:', error)
  }
}

// Função principal de registro
async function registerUser(validatedData: any): Promise<{ user: any; verificationToken: string }> {
  const { name, email, password, cpf, birthDate, phone } = validatedData
  
  console.log(`👤 [REGISTER] Iniciando registro para: ${email}`)
  
  // Hash da senha
  const hashedPassword = hashPassword(password)
  
  // Gerar token de verificação
  const verificationToken = generateVerificationToken()
  const verificationExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)
  
  // Criar usuário no banco
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      cpf,
      birthDate: new Date(birthDate),
      phone,
      emailVerified: null,
      verificationToken,
      verificationExpiry,
      role: 'USER',
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      birthDate: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  })
  
  console.log(`✅ [REGISTER] Usuário criado com ID: ${user.id}`)
  
  // Criar configurações padrão em background
  setImmediate(() => {
    createUserDefaults(user.id).catch(error => {
      console.error('❌ [REGISTER] Erro ao criar configurações padrão:', error)
    })
  })
  
  return { user, verificationToken }
}

// Função para enviar emails em background
async function sendRegistrationEmails(email: string, name: string, verificationToken: string): Promise<void> {
  try {
    const verificationUrl = createVerificationUrl(verificationToken)
    
    console.log(`📧 [REGISTER] Enviando emails para: ${email}`)
    
    // Enviar email de verificação
    const verificationResult = await sendVerificationEmail(email, name, verificationUrl)
    
    if (verificationResult.success) {
      console.log(`✅ [REGISTER] Email de verificação enviado via ${verificationResult.provider}`)
      
      // Enviar email de boas-vindas após verificação
      setTimeout(async () => {
        try {
          const welcomeResult = await sendWelcomeEmail(email, name)
          if (welcomeResult.success) {
            console.log(`✅ [REGISTER] Email de boas-vindas enviado via ${welcomeResult.provider}`)
          }
        } catch (error) {
          console.error('❌ [REGISTER] Erro ao enviar email de boas-vindas:', error)
        }
      }, 2000)
    } else {
      console.error('❌ [REGISTER] Falha no envio do email de verificação:', verificationResult.error)
    }
  } catch (error) {
    console.error('❌ [REGISTER] Erro no processo de envio de emails:', error)
  }
}

// Handler principal da API
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now()
  
  try {
    console.log('🚀 [REGISTER] Iniciando processo de registro')
    
    // Testar conexão com banco
    const dbConnected = await testDatabaseConnection()
    if (!dbConnected) {
      console.error('❌ [REGISTER] Falha na conexão com banco de dados')
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor. Tente novamente.'
      }, { status: 500 })
    }
    
    // Obter e sanitizar dados da requisição
    const rawData = await request.json()
    const sanitizedData = sanitizeInput(rawData)
    
    console.log('📝 [REGISTER] Dados recebidos e sanitizados')
    
    // Validar dados
    const validation = validateRegisterData(sanitizedData)
    if (!validation.success) {
      console.log('❌ [REGISTER] Dados inválidos:', validation.errors)
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const validatedData = validation.data!
    
    // Verificar se email já existe
    const emailExists = await checkEmailExists(validatedData.email)
    if (emailExists) {
      console.log(`❌ [REGISTER] Email já existe: ${validatedData.email}`)
      return NextResponse.json({
        success: false,
        message: 'Este email já está cadastrado'
      }, { status: 409 })
    }
    
    // Verificar se CPF já existe
    const cpfExists = await checkCpfExists(validatedData.cpf)
    if (cpfExists) {
      console.log(`❌ [REGISTER] CPF já existe: ${validatedData.cpf}`)
      return NextResponse.json({
        success: false,
        message: 'Este CPF já está cadastrado'
      }, { status: 409 })
    }
    
    // Registrar usuário
    const { user, verificationToken } = await registerUser(validatedData)
    
    // Enviar emails em background
    setImmediate(() => {
      sendRegistrationEmails(user.email, user.name, verificationToken).catch(error => {
        console.error('❌ [REGISTER] Erro no envio de emails:', error)
      })
    })
    
    const duration = Date.now() - startTime
    console.log(`✅ [REGISTER] Registro concluído em ${duration}ms para: ${user.email}`)
    
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu email para ativar a conta.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    }, { status: 201 })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ [REGISTER] Erro após ${duration}ms:`, error)
    
    // Verificar se é erro de constraint do banco (duplicata)
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint') || error.message.includes('unique')) {
        return NextResponse.json({
          success: false,
          message: 'Email ou CPF já cadastrado'
        }, { status: 409 })
      }
    }
    
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