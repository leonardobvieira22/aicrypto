/**
 * Configuração profissional do banco de dados
 * Sistema robusto para produção AWS Lambda + PostgreSQL
 */

import { PrismaClient } from '@prisma/client'

// Configurações de ambiente
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isAWSLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_REGION || process.env.AWS_AMPLIFY_BUILD)

// Log de debug apenas em desenvolvimento
if (isDevelopment) {
  console.log('[DEBUG] Variáveis de ambiente no runtime:', {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'NÃO DEFINIDA',
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AWS_AMPLIFY_BUILD: process.env.AWS_AMPLIFY_BUILD,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
  })
}

// Validação de variáveis de ambiente obrigatórias
function validateEnvironment() {
  const errors: string[] = []
  
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL é obrigatória')
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL deve ser uma conexão PostgreSQL válida')
  }
  
  if (isProduction && !process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET é obrigatória em produção')
  }
  
  if (errors.length > 0) {
    const errorMessage = `❌ [DATABASE] Erro de configuração:\n${errors.map(e => `  - ${e}`).join('\n')}`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

// Configuração do Prisma Client otimizada para AWS Lambda
function getDatabaseConfig() {
  const config: any = {
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  }
  
  // Configurações específicas para AWS Lambda/Amplify
  if (isAWSLambda || isProduction) {
    config.log = ['error'] // Apenas erros em produção
    
    // Configurações de timeout para AWS Lambda
    config.__internal = {
      engine: {
        connectTimeout: 10000, // 10 segundos
        queryTimeout: 30000,   // 30 segundos
      }
    }
  }
  
  return config
}

// Singleton global para reutilização de conexão
declare global {
  var __prisma: PrismaClient | undefined
}

// Função para criar cliente Prisma
function createPrismaClient(): PrismaClient {
  try {
    validateEnvironment()
    
    const config = getDatabaseConfig()
    console.log(`🔗 [DATABASE] Inicializando Prisma Client (${process.env.NODE_ENV})`)
    
    const client = new PrismaClient(config)
    
    // Configurar handlers de conexão para AWS Lambda
    if (isAWSLambda) {
      // Graceful shutdown para Lambda
      process.on('beforeExit', async () => {
        console.log('🔌 [DATABASE] Desconectando Prisma Client')
        await client.$disconnect()
      })
      
      // Handler para SIGTERM (AWS Lambda)
      process.on('SIGTERM', async () => {
        console.log('🔌 [DATABASE] SIGTERM recebido, desconectando Prisma Client')
        await client.$disconnect()
        process.exit(0)
      })
    }
    
    return client
  } catch (error) {
    console.error('❌ [DATABASE] Erro ao criar Prisma Client:', error)
    throw error
  }
}

// Exportar cliente singleton
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (isDevelopment) {
  globalThis.__prisma = prisma
}

// Função para testar conexão com retry
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ [DATABASE] Conexão com banco de dados estabelecida')
      return true
    } catch (error) {
      console.error(`❌ [DATABASE] Tentativa ${attempt}/${retries} falhou:`, error)
      
      if (attempt === retries) {
        console.error('❌ [DATABASE] Todas as tentativas de conexão falharam')
        return false
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return false
}

// Função para desconectar (útil para testes)
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('🔌 [DATABASE] Desconectado com sucesso')
  } catch (error) {
    console.error('❌ [DATABASE] Erro ao desconectar:', error)
  }
}

// Função para verificar saúde do banco
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - startTime
    
    return {
      connected: true,
      latency
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export default prisma 