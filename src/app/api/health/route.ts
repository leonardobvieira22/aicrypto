import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/config/database'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Verificar variáveis de ambiente críticas
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      MAILERSEND_API_TOKEN: !!process.env.MAILERSEND_API_TOKEN,
      NEXT_PUBLIC_BINANCE_API_KEY: !!process.env.NEXT_PUBLIC_BINANCE_API_KEY,
    }
    
    // Verificar conexão com banco de dados
    const dbHealth = await checkDatabaseHealth()
    
    // Calcular tempo total de resposta
    const responseTime = Date.now() - startTime
    
    // Determinar status geral
    const allEnvVarsPresent = Object.values(envCheck).every(Boolean)
    const isHealthy = allEnvVarsPresent && dbHealth.connected
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      responseTime: `${responseTime}ms`,
      checks: {
        environment: {
          status: allEnvVarsPresent ? 'pass' : 'fail',
          details: envCheck
        },
        database: {
          status: dbHealth.connected ? 'pass' : 'fail',
          latency: dbHealth.latency ? `${dbHealth.latency}ms` : undefined,
          error: dbHealth.error
        }
      },
      aws: {
        amplify: !!process.env.AWS_AMPLIFY_BUILD,
        lambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
        region: process.env.AWS_REGION
      }
    }
    
    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('[HEALTH] Erro no health check:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
} 