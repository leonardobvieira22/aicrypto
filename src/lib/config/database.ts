/**
 * Configuração profissional do banco de dados
 * Sistema robusto para produção AWS Lambda + PostgreSQL
 */

import { PrismaClient } from '@prisma/client'

// Configurações de ambiente
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isAWSLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_REGION)

// Validação de variáveis de ambiente obrigatórias
function validateEnvironment() {
  if (isProduction && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL é obrigatória em produção')
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL deve ser uma conexão PostgreSQL válida')
  }
}

// Configuração do Prisma Client
function getDatabaseConfig() {
  // ATENÇÃO: Limite de conexões deve ser feito na string DATABASE_URL, não aqui!
  // Exemplo: postgresql://user:pass@host:port/db?connection_limit=1
  return {
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
    // NÃO adicionar connectionLimit ou pool aqui!
  }
}

// Singleton global para reutilização de conexão
declare global {
  var __prisma: PrismaClient | undefined
}

// Função para criar cliente Prisma
function createPrismaClient(): PrismaClient {
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
  }
  
  return client
}

// Exportar cliente singleton
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (isDevelopment) {
  globalThis.__prisma = prisma
}

// Função para testar conexão
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ [DATABASE] Conexão com banco de dados estabelecida')
    return true
  } catch (error) {
    console.error('❌ [DATABASE] Erro na conexão:', error)
    return false
  }
}

// Função para desconectar (útil para testes)
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export default prisma 