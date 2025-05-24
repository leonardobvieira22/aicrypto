import { NextRequest, NextResponse } from 'next/server'
import { debugEnvironmentVariables } from '@/lib/debug-env'

export async function GET(request: NextRequest) {
  try {
    const envStatus = debugEnvironmentVariables()
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      message: 'Health check realizado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 