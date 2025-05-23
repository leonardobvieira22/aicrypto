#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupBinanceConfig() {
  console.log('🚀 Configuração da API da Binance\n');
  
  console.log('Para configurar dados reais da Binance, você precisa:');
  console.log('1. Ter uma conta na Binance verificada');
  console.log('2. Criar chaves de API em: https://www.binance.com/en/my/settings/api-management');
  console.log('3. Configurar permissões para "Spot & Margin Trading"\n');
  
  const wantsConfigure = await question('Deseja configurar agora? (s/n): ');
  
  if (wantsConfigure.toLowerCase() !== 's') {
    console.log('✅ Ok! Você pode configurar mais tarde criando um arquivo .env.local');
    process.exit(0);
  }
  
  const apiKey = await question('Digite sua API Key da Binance: ');
  const apiSecret = await question('Digite sua Secret Key da Binance: ');
  const demoMode = await question('Usar modo de demonstração? (s/n) [padrão: n]: ');
  
  const envContent = `
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret"

# Binance API Configuration
NEXT_PUBLIC_BINANCE_API_KEY="${apiKey}"
BINANCE_API_SECRET="${apiSecret}"
NEXT_PUBLIC_DEMO_MODE="${demoMode.toLowerCase() === 's' ? 'true' : 'false'}"
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent.trim());
    console.log('\n✅ Arquivo .env.local criado com sucesso!');
    console.log('🔄 Reinicie o servidor de desenvolvimento para aplicar as mudanças:');
    console.log('   npm run dev');
    console.log('\n⚠️  IMPORTANTE: Mantenha suas chaves seguras e nunca as compartilhe!');
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env.local:', error.message);
  }
  
  rl.close();
}

setupBinanceConfig().catch(console.error); 