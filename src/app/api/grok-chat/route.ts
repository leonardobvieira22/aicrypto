import { NextRequest, NextResponse } from 'next/server'

// Interface para a requisição da Grok API
interface GrokChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model: string
  stream: boolean
  temperature: number
}

// Interface para a resposta da Grok API
interface GrokChatResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Chave da API Grok - DEVE vir das variáveis de ambiente por segurança
// Tentativas múltiplas de leitura para AWS Amplify
const GROK_API_KEY = process.env.GROK_API_KEY || 
                     process.env.NEXT_GROK_API_KEY ||
                     process.env.AWS_GROK_API_KEY ||
                     null

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

// Debug log para AWS Amplify
console.log('🔍 [GROK DEBUG] Verificando variáveis de ambiente...')
console.log('🔍 [GROK DEBUG] process.env.GROK_API_KEY presente:', !!process.env.GROK_API_KEY)
console.log('🔍 [GROK DEBUG] process.env.NEXT_GROK_API_KEY presente:', !!process.env.NEXT_GROK_API_KEY)
console.log('🔍 [GROK DEBUG] process.env.AWS_GROK_API_KEY presente:', !!process.env.AWS_GROK_API_KEY)
console.log('🔍 [GROK DEBUG] GROK_API_KEY final presente:', !!GROK_API_KEY)
console.log('🔍 [GROK DEBUG] GROK_API_KEY length:', GROK_API_KEY?.length || 0)
console.log('🔍 [GROK DEBUG] NODE_ENV:', process.env.NODE_ENV)
console.log('🔍 [GROK DEBUG] AWS_AMPLIFY_BUILD:', process.env.AWS_AMPLIFY_BUILD)
console.log('🔍 [GROK DEBUG] Todas as env vars com GROK:', Object.keys(process.env).filter(k => k.includes('GROK')))

export async function POST(request: NextRequest) {
  try {
    // Log adicional para debug
    console.log('🔍 [GROK] Iniciando requisição do chat...')
    console.log('🔍 [GROK] API Key disponível:', !!GROK_API_KEY)

    // Validação da chave da API com logging melhorado
    if (!GROK_API_KEY) {
      console.error('❌ [GROK ERROR] GROK_API_KEY não configurada')
      console.error('❌ [GROK ERROR] Todas as variáveis env:', Object.keys(process.env).filter(key => key.includes('GROK')))
      return NextResponse.json(
        { error: 'Configuração da API não encontrada. Verifique as variáveis de ambiente.' },
        { status: 500 }
      )
    }

    // Parse do corpo da requisição
    const body = await request.json()
    const { message, context } = body

    console.log('🔍 [GROK] Mensagem recebida:', message.substring(0, 50) + '...')

    // Validação dos dados de entrada
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória e deve ser uma string' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Mensagem muito longa. Máximo 1000 caracteres.' },
        { status: 400 }
      )
    }

    // Construção do prompt especializado em trading
    const systemPrompt = `Você é um assistente especializado em trading de criptomoedas e análise de mercado. 

DIRETRIZES:
- Forneça insights práticos e acionáveis sobre trading de criptomoedas
- Use linguagem clara e acessível, mas mantenha profissionalismo
- Inclua alertas sobre riscos quando relevante
- Baseie-se em análise técnica e fundamental quando apropriado
- Responda em português brasileiro
- Mantenha respostas concisas e diretas (máximo 300 palavras)
- Não forneça conselhos financeiros específicos, apenas educação e insights gerais

CONTEXTO: ${context || 'trading de criptomoedas'}

Responda de forma útil e educativa, sempre lembrando que trading envolve riscos.`

    // Preparação da requisição para a Grok API
    const grokRequest: GrokChatRequest = {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message.trim()
        }
      ],
      model: 'grok-3-latest',
      stream: false,
      temperature: 0.7
    }

    console.log('🔍 [GROK] Fazendo chamada para API Grok...')

    // Chamada para a API da Grok
    const grokResponse = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify(grokRequest)
    })

    console.log('🔍 [GROK] Resposta recebida, status:', grokResponse.status)

    // Verificação da resposta da API
    if (!grokResponse.ok) {
      const errorText = await grokResponse.text()
      console.error('❌ [GROK ERROR] Erro na API Grok:', grokResponse.status, errorText)
      
      // Tratamento de diferentes tipos de erro
      if (grokResponse.status === 401) {
        return NextResponse.json(
          { error: 'Erro de autenticação com a API Grok. Verifique a chave da API.' },
          { status: 500 }
        )
      } else if (grokResponse.status === 429) {
        return NextResponse.json(
          { error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          { error: 'Erro interno no serviço de IA' },
          { status: 500 }
        )
      }
    }

    // Parse da resposta da Grok
    const grokData: GrokChatResponse = await grokResponse.json()

    // Validação da estrutura da resposta
    if (!grokData.choices || grokData.choices.length === 0) {
      console.error('❌ [GROK ERROR] Resposta inválida da API Grok:', grokData)
      return NextResponse.json(
        { error: 'Resposta inválida da IA' },
        { status: 500 }
      )
    }

    const assistantMessage = grokData.choices[0].message.content

    // Validação do conteúdo da resposta
    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'Resposta vazia da IA' },
        { status: 500 }
      )
    }

    // Log para monitoramento (em produção, usar um sistema de logs adequado)
    console.log('✅ [GROK SUCCESS] Chat request processado:', {
      userMessage: message.substring(0, 100) + '...',
      responseLength: assistantMessage.length,
      tokensUsed: grokData.usage?.total_tokens || 0,
      timestamp: new Date().toISOString()
    })

    // Resposta bem-sucedida
    return NextResponse.json({
      response: assistantMessage,
      metadata: {
        model: 'grok-3-latest',
        tokensUsed: grokData.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    // Log do erro
    console.error('❌ [GROK ERROR] Erro no endpoint grok-chat:', error)

    // Tratamento de diferentes tipos de erro
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de dados inválido' },
        { status: 400 }
      )
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Erro de conectividade com o serviço de IA' },
        { status: 503 }
      )
    }

    // Erro genérico
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Middleware para OPTIONS (CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 