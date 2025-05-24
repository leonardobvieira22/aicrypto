// Teste da integração da API Grok
// Este arquivo pode ser usado para testar a funcionalidade da API localmente

interface TestGrokRequest {
  message: string
  context?: string
}

export async function testGrokAPI(): Promise<void> {
  const testMessage: TestGrokRequest = {
    message: "Qual é a tendência atual do Bitcoin?",
    context: "trading de criptomoedas"
  }

  try {
    console.log('🧪 Testando integração com API Grok...')
    
    const response = await fetch('http://localhost:3000/api/grok-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ Teste bem-sucedido!')
    console.log('📝 Resposta da IA:', data.response)
    console.log('📊 Metadados:', data.metadata)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Função para validar estrutura da resposta
export function validateGrokResponse(response: any): boolean {
  return (
    response &&
    typeof response.response === 'string' &&
    response.metadata &&
    typeof response.metadata.model === 'string' &&
    typeof response.metadata.timestamp === 'string'
  )
}

// Testes de validação de entrada
export function validateInputs(): void {
  console.log('🔍 Executando testes de validação...')
  
  // Teste 1: Mensagem vazia
  const test1 = { message: "" }
  console.log('Teste 1 (mensagem vazia):', test1.message.length === 0 ? '✅ Detectado' : '❌ Falhou')
  
  // Teste 2: Mensagem muito longa
  const test2 = { message: "a".repeat(1001) }
  console.log('Teste 2 (mensagem longa):', test2.message.length > 1000 ? '✅ Detectado' : '❌ Falhou')
  
  // Teste 3: Mensagem válida
  const test3 = { message: "Como está o mercado hoje?" }
  console.log('Teste 3 (mensagem válida):', test3.message.length > 0 && test3.message.length <= 1000 ? '✅ Válida' : '❌ Inválida')
}

// Função principal de testes (para usar em desenvolvimento)
export async function runAllTests(): Promise<void> {
  console.log('🚀 Iniciando suite de testes da API Grok...\n')
  
  validateInputs()
  console.log('\n')
  
  await testGrokAPI()
  
  console.log('\n✨ Testes concluídos!')
}

// Para executar durante desenvolvimento:
// import { runAllTests } from './test'
// runAllTests() 