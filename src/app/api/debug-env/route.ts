import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Este endpoint é apenas para debug - REMOVER EM PRODUÇÃO
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    nextJsInfo: {
      // Verifica se estamos no ambiente Next.js correto
      isServer: typeof window === 'undefined',
      hasNextConfig: !!process.env.NEXT_CONFIG,
      nextPhase: process.env.NEXT_PHASE,
      amplifyBuild: process.env.AWS_AMPLIFY_BUILD,
    },
    variables: {
      // Variáveis que devem estar presentes
      hasGrokApiKey: !!process.env.GROK_API_KEY,
      grokKeyLength: process.env.GROK_API_KEY?.length || 0,
      grokKeyPrefix: process.env.GROK_API_KEY?.substring(0, 10) || 'não encontrada',
      
      // Outras variáveis importantes
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasBinanceSecret: !!process.env.BINANCE_API_SECRET,
      hasMailerSend: !!process.env.MAILERSEND_API_TOKEN,
      
      // Lista todas as variáveis que contêm 'GROK'
      allGrokVars: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('grok')
      ),
      
      // Lista todas as variáveis que começam com 'NEXT'
      allNextVars: Object.keys(process.env).filter(key => 
        key.startsWith('NEXT')
      ),
      
      // Lista todas as variáveis que começam com 'AWS'
      allAwsVars: Object.keys(process.env).filter(key => 
        key.startsWith('AWS')
      ),
      
      // Total de variáveis de ambiente
      totalEnvVars: Object.keys(process.env).length
    },
    // Informações sobre arquivos de configuração
    configFiles: {
      hasEnvProduction: process.env.NODE_ENV === 'production' ? 'N/A (runtime check)' : false,
      hasEnvLocal: process.env.NODE_ENV === 'development' ? 'N/A (runtime check)' : false,
    }
  }

  console.log('🔍 [DEBUG] Informações do ambiente:', debugInfo)

  return NextResponse.json(debugInfo)
}

export async function POST(request: NextRequest) {
  // Endpoint para testar a API Grok rapidamente
  try {
    const GROK_API_KEY = process.env.GROK_API_KEY
    
    if (!GROK_API_KEY) {
      return NextResponse.json({ 
        error: 'GROK_API_KEY não encontrada',
        debug: {
          allVars: Object.keys(process.env).filter(key => key.includes('GROK')),
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 })
    }

    // Teste simples da API
    const testResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Teste de conexão. Responda apenas "OK".' }
        ],
        model: 'grok-3-latest',
        stream: false,
        temperature: 0
      })
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      return NextResponse.json({
        error: 'Falha no teste da API Grok',
        status: testResponse.status,
        details: errorText
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'API Grok funcionando corretamente!',
      status: testResponse.status
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Erro no teste da API',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 