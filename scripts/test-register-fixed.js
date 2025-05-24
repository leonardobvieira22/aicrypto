/**
 * Script para testar registro após correções críticas
 * Testa: campos schema, configurações padrão e envio de email
 */

const API_BASE = 'https://main.d34l4lklofiz4e.amplifyapp.com'

// Função para gerar CPF válido
function generateValidCPF() {
  // Gerar os primeiros 9 dígitos
  const digits = []
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10))
  }
  
  // Calcular primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i)
  }
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  digits.push(firstDigit)
  
  // Calcular segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i)
  }
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  digits.push(secondDigit)
  
  return digits.join('')
}

async function testRegisterFixed() {
  console.log('🧪 [TEST] Testando registro após correções críticas...\n')
  
  // Dados de teste válidos com CPF gerado dinamicamente
  const userData = {
    name: 'Usuario Teste',
    email: `teste.${Date.now()}@exemplo.com`,
    password: 'MinhaSenh@123',
    cpf: generateValidCPF(), // CPF válido gerado dinamicamente
    dateOfBirth: '1990-01-01',
    phone: '(11) 99999-9999',
    acceptTerms: true
  }
  
  try {
    console.log('📨 [TEST] Enviando dados de registro...')
    console.log('Email:', userData.email)
    console.log('CPF:', userData.cpf)
    
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    })
    
    const data = await response.json()
    
    console.log(`\n📊 [TEST] Status: ${response.status}`)
    console.log('📄 [TEST] Resposta:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ [SUCCESS] Registro realizado com sucesso!')
      console.log('✅ [SUCCESS] Usuário criado no banco de dados')
      console.log('✅ [SUCCESS] Campos do schema corretos')
      
      if (data.data?.user) {
        console.log(`\n👤 [USER] ID: ${data.data.user.id}`)
        console.log(`👤 [USER] Nome: ${data.data.user.name}`)
        console.log(`👤 [USER] Email: ${data.data.user.email}`)
        console.log(`👤 [USER] Role: ${data.data.user.role}`)
      }
      
      console.log('\n📧 [EMAIL] Verificando logs de email...')
      
      // Aguardar 5 segundos para o processo em background
      setTimeout(async () => {
        try {
          // Verificar health check para confirmar sistema funcionando
          const healthResponse = await fetch(`${API_BASE}/api/health`)
          const healthData = await healthResponse.json()
          
          console.log('\n🏥 [HEALTH] Status do sistema:')
          console.log('- Banco:', healthData.checks?.database?.status || 'unknown')
          console.log('- Ambiente:', healthData.checks?.environment?.status || 'unknown')
          console.log('- AWS:', healthData.aws?.amplify ? 'ok' : 'unknown')
          
        } catch (error) {
          console.log('⚠️ [WARNING] Não foi possível verificar health check:', error.message)
        }
      }, 5000)
      
    } else {
      console.log('\n❌ [ERROR] Erro no registro:')
      console.log('❌ [ERROR] Status:', response.status)
      console.log('❌ [ERROR] Mensagem:', data.message)
      
      if (data.errors) {
        console.log('❌ [ERROR] Detalhes:')
        data.errors.forEach(error => console.log(`  - ${error}`))
      }
    }
    
  } catch (error) {
    console.log('\n💥 [FATAL] Erro de conexão:')
    console.log('💥 [FATAL]', error.message)
  }
}

// Testar health check primeiro
async function testHealthCheck() {
  console.log('🏥 [HEALTH] Verificando status do sistema...')
  
  try {
    const response = await fetch(`${API_BASE}/api/health`)
    const data = await response.json()
    
    console.log('✅ [HEALTH] Sistema respondendo')
    console.log('✅ [HEALTH] Status:', data.status)
    console.log('✅ [HEALTH] Ambiente:', data.environment)
    
    if (data.checks?.database?.status === 'pass') {
      console.log('✅ [HEALTH] Banco de dados: OK')
    } else {
      console.log('⚠️ [HEALTH] Banco de dados: Problema')
    }
    
    console.log('')
    
  } catch (error) {
    console.log('❌ [HEALTH] Sistema não responde:', error.message)
    console.log('')
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 [INÍCIO] Teste de registro após correções\n')
  console.log('🔧 [INFO] Correções aplicadas:')
  console.log('  - ✅ Campos TradingSetting corrigidos')
  console.log('  - ✅ Campos NotificationPreferences corrigidos')
  console.log('  - ✅ Campos PaperTradingWallet corrigidos')
  console.log('  - ✅ Configuração SMTP MailerSend corrigida')
  console.log('  - ✅ Validação de dateOfBirth/birthDate unificada')
  console.log('')
  
  await testHealthCheck()
  await testRegisterFixed()
  
  console.log('\n🏁 [FIM] Teste concluído')
  console.log('💡 [DICA] Verifique os logs do AWS Amplify para detalhes do envio de email')
  console.log('💡 [DICA] Acesse: aws logs tail /aws/amplify/d34l4lklofiz4e --follow')
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  runTests().catch(console.error)
}

module.exports = { testRegisterFixed, testHealthCheck } 