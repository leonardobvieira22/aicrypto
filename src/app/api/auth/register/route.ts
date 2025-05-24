/**
 * API de Registro de Usuário - Sistema Profissional
 * Funcionalidades: Validação, Hash de senha, Criação de dados relacionados, Email
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, pbkdf2Sync } from 'crypto'
import logger from '@/lib/logger'

// Importações seguras
let prisma: any = null
let testDatabaseConnection: any = null
let validateRegisterData: any = null
let sanitizeInput: any = null
let sendVerificationEmail: any = null
let sendWelcomeEmail: any = null

// Função para carregar dependências de forma segura
const loadDependencies = () => {
  try {
    if (!prisma) {
      const dbModule = require('@/lib/config/database')
      prisma = dbModule.prisma
      testDatabaseConnection = dbModule.testDatabaseConnection
    }
    
    if (!validateRegisterData) {
      const validationModule = require('@/lib/validation/auth')
      validateRegisterData = validationModule.validateRegisterData
      sanitizeInput = validationModule.sanitizeInput
    }
    
    if (!sendVerificationEmail) {
      const emailModule = require('@/lib/services/email')
      sendVerificationEmail = emailModule.sendVerificationEmail
      sendWelcomeEmail = emailModule.sendWelcomeEmail
    }
    
    return true
  } catch (error) {
    logger.error('[REGISTER] Erro ao carregar dependências:', error)
    return false
  }
}

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
    if (!prisma) {
      logger.error('❌ [REGISTER] Prisma não disponível para verificar email')
      return false
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })
    return !!user
  } catch (error) {
    logger.error('❌ [REGISTER] Erro ao verificar email:', error)
    return false
  }
}

// Função para verificar se CPF já existe
async function checkCpfExists(cpf: string): Promise<boolean> {
  try {
    if (!prisma) {
      logger.error('❌ [REGISTER] Prisma não disponível para verificar CPF')
      return false
    }
    
    const user = await prisma.user.findUnique({
      where: { cpf },
      select: { id: true }
    })
    return !!user
  } catch (error) {
    logger.error('❌ [REGISTER] Erro ao verificar CPF:', error)
    return false
  }
}

// Função para criar configurações padrão do usuário
async function createUserDefaults(userId: string): Promise<void> {
  try {
    if (!prisma) {
      logger.error('❌ [REGISTER] Prisma não disponível para criar configurações padrão')
      return
    }
    
    logger.info(`🔧 [REGISTER] Criando configurações padrão para usuário: ${userId}`)
    
    // Criar configurações de trading com campos corretos do schema
    await prisma.tradingSetting.create({
      data: {
        userId,
        riskLevel: 'MEDIUM',
        defaultOrderSize: 5.0,
        maxOpenPositions: 5,
        defaultLeverage: 1.0,
        enableStopLoss: true,
        stopLossPercentage: 5.0,
        enableTakeProfit: true,
        takeProfitPercentage: 15.0,
        tradingPairs: ['BTCUSDT', 'ETHUSDT']
      }
    })
    
    // Criar carteira de paper trading (campo currency não existe no schema)
    await prisma.paperTradingWallet.create({
      data: {
        userId,
        balance: 10000.0,
        equity: 10000.0
      }
    })
    
    // Criar preferências de notificação com campos corretos do schema
    await prisma.notificationPreferences.create({
      data: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        emailFrequency: 'INSTANT',
        marketUpdates: true,
        tradeAlerts: true,
        securityAlerts: true,
        newsAlerts: false,
        priceAlerts: true,
        robotAlerts: true,
        subscriptionAlerts: true,
        quietHoursEnabled: false,
        timezone: 'UTC'
      }
    })
    
    logger.info('✅ [REGISTER] Configurações padrão criadas com sucesso')
  } catch (error) {
    logger.error('❌ [REGISTER] Erro ao criar configurações padrão:', error)
  }
}

// Função principal de registro
async function registerUser(validatedData: any): Promise<{ user: any; verificationToken: string }> {
  const { name, email, password, cpf, dateOfBirth, phone } = validatedData
  
  logger.info(`👤 [REGISTER] Iniciando registro para: ${email}`)
  
  if (!prisma) {
    throw new Error('Banco de dados não disponível')
  }
  
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
      dateOfBirth: new Date(dateOfBirth),
      phone,
      emailVerified: null,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpiry,
      role: 'USER',
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      dateOfBirth: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  })
  
  logger.info(`✅ [REGISTER] Usuário criado com ID: ${user.id}`)
  
  // Criar configurações padrão em background
  setImmediate(() => {
    createUserDefaults(user.id).catch(error => {
      logger.error('❌ [REGISTER] Erro ao criar configurações padrão:', error)
    })
  })
  
  return { user, verificationToken }
}

// Função para enviar emails em background
async function sendRegistrationEmails(email: string, name: string, verificationToken: string): Promise<void> {
  try {
    if (!sendVerificationEmail || !sendWelcomeEmail) {
      logger.warn('⚠️ [REGISTER] Serviços de email não disponíveis')
      return
    }
    
    const verificationUrl = createVerificationUrl(verificationToken)
    
    logger.info(`📧 [REGISTER] Enviando emails para: ${email}`)
    
    // Enviar email de verificação
    const verificationResult = await sendVerificationEmail(email, name, verificationUrl)
    
    if (verificationResult.success) {
      logger.info(`✅ [REGISTER] Email de verificação enviado via ${verificationResult.provider}`)
      
      // Enviar email de boas-vindas após verificação
      setTimeout(async () => {
        try {
          const welcomeResult = await sendWelcomeEmail(email, name)
          if (welcomeResult.success) {
            logger.info(`✅ [REGISTER] Email de boas-vindas enviado via ${welcomeResult.provider}`)
          }
        } catch (error) {
          logger.error('❌ [REGISTER] Erro ao enviar email de boas-vindas:', error)
        }
      }, 2000)
    } else {
      logger.error('❌ [REGISTER] Falha no envio do email de verificação:', verificationResult.error)
    }
  } catch (error) {
    logger.error('❌ [REGISTER] Erro no processo de envio de emails:', error)
  }
}

// Handler principal da API
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now()
  
  try {
    logger.info('🚀 [REGISTER] Iniciando processo de registro')
    
    // Carregar dependências
    const dependenciesLoaded = loadDependencies()
    if (!dependenciesLoaded) {
      logger.error('❌ [REGISTER] Falha ao carregar dependências')
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor. Tente novamente.'
      }, { status: 500 })
    }
    
    // Testar conexão com banco
    if (testDatabaseConnection) {
      const dbConnected = await testDatabaseConnection()
      if (!dbConnected) {
        logger.error('❌ [REGISTER] Falha na conexão com banco de dados')
        return NextResponse.json({
          success: false,
          message: 'Erro interno do servidor. Tente novamente.'
        }, { status: 500 })
      }
    }
    
    // Obter e sanitizar dados da requisição
    let rawData: any
    try {
      rawData = await request.json()
    } catch (error) {
      logger.error('❌ [REGISTER] Erro ao parsear JSON:', error)
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos na requisição'
      }, { status: 400 })
    }
    
    const sanitizedData = sanitizeInput ? sanitizeInput(rawData) : rawData
    
    logger.info('📝 [REGISTER] Dados recebidos e sanitizados')
    
    // Validar dados
    if (!validateRegisterData) {
      logger.error('❌ [REGISTER] Função de validação não disponível')
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor. Tente novamente.'
      }, { status: 500 })
    }
    
    const validation = validateRegisterData(sanitizedData)
    if (!validation.success) {
      logger.info('❌ [REGISTER] Dados inválidos:', validation.errors)
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
      logger.info(`❌ [REGISTER] Email já existe: ${validatedData.email}`)
      return NextResponse.json({
        success: false,
        message: 'Este email já está cadastrado'
      }, { status: 409 })
    }
    
    // Verificar se CPF já existe
    const cpfExists = await checkCpfExists(validatedData.cpf)
    if (cpfExists) {
      logger.info(`❌ [REGISTER] CPF já existe: ${validatedData.cpf}`)
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
        logger.error('❌ [REGISTER] Erro no envio de emails:', error)
      })
    })
    
    const duration = Date.now() - startTime
    logger.info(`✅ [REGISTER] Registro concluído em ${duration}ms para: ${user.email}`)
    
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
    logger.error(`❌ [REGISTER] Erro após ${duration}ms:`, error)
    
    // Verificar se é erro de constraint do banco (duplicata)
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint') || error.message.includes('unique')) {
        return NextResponse.json({
          success: false,
          message: 'Email ou CPF já cadastrado'
        }, { status: 409 })
      }
      
      if (error.message.includes('Banco de dados não disponível')) {
        return NextResponse.json({
          success: false,
          message: 'Serviço temporariamente indisponível. Tente novamente.'
        }, { status: 503 })
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