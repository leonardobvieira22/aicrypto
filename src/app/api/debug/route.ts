import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar se estamos em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'Debug endpoint não disponível em produção'
      }, { status: 403 })
    }

    const debugInfo = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        AWS_REGION: process.env.AWS_REGION,
        AWS_AMPLIFY_BUILD: process.env.AWS_AMPLIFY_BUILD,
        AMPLIFY_BUILD: process.env.AMPLIFY_BUILD,
      },
      nextauth: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'PRESENTE' : 'AUSENTE',
      },
      database: {
        DATABASE_URL: process.env.DATABASE_URL ? 'PRESENTE' : 'AUSENTE',
        DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + '...',
      },
      email: {
        MAILERSEND_API_TOKEN: process.env.MAILERSEND_API_TOKEN ? 'PRESENTE' : 'AUSENTE',
        MAILERSEND_DOMAIN: process.env.MAILERSEND_DOMAIN,
      },
      runtime: {
        isServer: typeof window === 'undefined',
        timestamp: new Date().toISOString(),
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    console.error('Erro no debug endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 