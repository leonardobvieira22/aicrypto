/**
 * Script para testar o emailService diretamente
 */

const API_BASE = 'https://main.d34l4lklofiz4e.amplifyapp.com'

async function testEmailService() {
  console.log('📧 [TEST] Testando emailService diretamente...\n')
  
  const emailData = {
    email: 'leonardobvieira22@gmail.com',
    name: 'Teste Email Service'
  }
  
  try {
    console.log('📨 [TEST] Enviando email de teste...')
    console.log('Email:', emailData.email)
    console.log('Nome:', emailData.name)
    
    const response = await fetch(`${API_BASE}/api/auth/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })
    
    const data = await response.json()
    
    console.log(`\n📊 [TEST] Status: ${response.status}`)
    console.log('📄 [TEST] Resposta:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ [SUCCESS] Email de teste enviado com sucesso!')
      console.log('✅ [SUCCESS] EmailService está funcionando')
      
      if (data.details) {
        console.log('\n📧 [DETAILS] Detalhes do envio:')
        console.log(JSON.stringify(data.details, null, 2))
      }
      
    } else {
      console.log('\n❌ [ERROR] Erro no envio do email:')
      console.log('❌ [ERROR] Status:', response.status)
      console.log('❌ [ERROR] Mensagem:', data.message)
      
      if (data.error) {
        console.log('❌ [ERROR] Detalhes:', data.error)
      }
    }
    
  } catch (error) {
    console.log('\n💥 [FATAL] Erro de conexão:')
    console.log('💥 [FATAL]', error.message)
  }
}

// Executar teste
async function runTest() {
  console.log('🚀 [INÍCIO] Teste do EmailService\n')
  
  await testEmailService()
  
  console.log('\n🏁 [FIM] Teste concluído')
  console.log('💡 [DICA] Verifique os logs do AWS Amplify para detalhes')
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  runTest().catch(console.error)
}

module.exports = { testEmailService } 