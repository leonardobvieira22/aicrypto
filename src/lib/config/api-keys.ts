// Credenciais seguras para a API da Binance
// TODAS as credenciais devem vir de variáveis de ambiente

// Credenciais "mãe" para obter dados de preços (sempre ativas)
// Essas credenciais são usadas para buscar dados de mercado em tempo real
export const BINANCE_MASTER_API_KEYS = {
  // Usando APENAS variáveis de ambiente por segurança
  apiKey: process.env.NEXT_PUBLIC_BINANCE_API_KEY || '',
  apiSecret: process.env.BINANCE_API_SECRET || ''
}

console.log('🔑 [BINANCE] Credenciais carregadas - API Key:', BINANCE_MASTER_API_KEYS.apiKey.substring(0, 10) + '...')

// Verificar se as credenciais foram carregadas
if (!BINANCE_MASTER_API_KEYS.apiKey || !BINANCE_MASTER_API_KEYS.apiSecret) {
  console.warn('⚠️ [BINANCE] Credenciais mãe não configuradas nas variáveis de ambiente')
}

// Função para obter credenciais mãe (sempre usadas para dados do gráfico)
export const getMasterBinanceCredentials = () => {
  return BINANCE_MASTER_API_KEYS
}

// Função para obter credenciais do usuário (para funcionalidades futuras)
export const getUserBinanceCredentials = () => {
  // Buscar do localStorage (configuração do usuário)
  if (typeof window !== 'undefined') {
    const storedApiKey = localStorage.getItem('user_binance_api_key')
    const storedApiSecret = localStorage.getItem('user_binance_api_secret')

    if (storedApiKey && storedApiSecret) {
      return {
        apiKey: storedApiKey,
        apiSecret: storedApiSecret
      }
    }
  }

  return null // Retorna null se não há credenciais do usuário
}

// Verificar se as credenciais do usuário estão configuradas
export const hasUserCredentials = () => {
  const userCreds = getUserBinanceCredentials()
  return userCreds !== null && userCreds.apiKey !== "" && userCreds.apiSecret !== ""
}

// Verificar se as credenciais mãe estão configuradas
export const hasMasterCredentials = () => {
  return BINANCE_MASTER_API_KEYS.apiKey !== "" && BINANCE_MASTER_API_KEYS.apiSecret !== ""
}
