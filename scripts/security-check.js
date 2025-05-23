#!/usr/bin/env node

/**
 * Script de Verificação de Segurança para Deploy AWS Amplify
 * 
 * Este script verifica problemas de segurança que podem impedir
 * uma implantação segura em produção.
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

let hasErrors = false;
let hasWarnings = false;

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log('red', `❌ ERRO: ${message}`);
  hasErrors = true;
}

function warning(message) {
  log('yellow', `⚠️  AVISO: ${message}`);
  hasWarnings = true;
}

function success(message) {
  log('green', `✅ ${message}`);
}

function info(message) {
  log('cyan', `ℹ️  ${message}`);
}

log('magenta', '=== VERIFICAÇÃO DE SEGURANÇA PARA AWS AMPLIFY ===\n');

// 1. Verificar .env no gitignore
info('Verificando configuração do .gitignore...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (!gitignore.includes('.env')) {
    error('Arquivo .env não está no .gitignore - riscos de vazamento de credenciais');
  } else {
    success('.gitignore configurado corretamente');
  }
} catch (err) {
  warning('Arquivo .gitignore não encontrado');
}

// 2. Verificar se existe .env com credenciais reais
info('Verificando arquivo .env...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('VGQ0dhdCcHjDhEjj0Xuue3ZtyIZHiG9NK8chA4ew0HMQMywydjrVrLTWeN8nnZ9e')) {
    error('Credenciais reais da Binance encontradas no arquivo .env');
    error('NUNCA faça commit de credenciais reais para o repositório');
  }
  if (envContent.includes('localhost')) {
    warning('URLs localhost encontradas no .env - atualize para produção');
  }
  success('Arquivo .env verificado');
} catch (err) {
  warning('Arquivo .env não encontrado');
}

// 3. Verificar arquivos de código por credenciais hardcoded
info('Verificando credenciais hardcoded no código...');
const filesToCheck = [
  'src/lib/config/api-keys.ts',
  'src/app/api/auth/[...nextauth]/route.ts'
];

filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificar API keys da Binance hardcoded
    if (content.includes('"VGQ0dhdCcHjDhEjj0Xuue3ZtyIZHiG9NK8chA4ew0HMQMywydjrVrLTWeN8nnZ9e"')) {
      error(`Credenciais Binance hardcoded encontradas em ${file}`);
    }
    
    // Verificar senhas hardcoded
    if (content.includes('admin123') || content.includes('demo123')) {
      warning(`Senhas de demonstração hardcoded encontradas em ${file}`);
    }
    
    // Verificar uso de process.env
    if (content.includes('process.env.')) {
      success(`Uso correto de variáveis de ambiente em ${file}`);
    }
    
  } catch (err) {
    warning(`Não foi possível verificar ${file}`);
  }
});

// 4. Verificar next.config.js
info('Verificando configurações do Next.js...');
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  if (nextConfig.includes('ignoreBuildErrors: true')) {
    warning('TypeScript build errors são ignorados - pode mascarar problemas');
  }
  if (nextConfig.includes('unoptimized: true')) {
    warning('Otimização de imagens desabilitada - pode afetar performance');
  }
  success('next.config.js verificado');
} catch (err) {
  error('next.config.js não encontrado');
}

// 5. Verificar package.json por dependências de segurança
info('Verificando dependências...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Verificar se as dependências estão atualizadas
  const criticalDeps = ['next', 'react', 'next-auth'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      success(`Dependência crítica ${dep} presente`);
    }
  });
  
} catch (err) {
  error('package.json não encontrado ou inválido');
}

// 6. Verificar amplify.yml
info('Verificando configuração do AWS Amplify...');
try {
  const amplifyConfig = fs.readFileSync('amplify.yml', 'utf8');
  if (amplifyConfig.includes('DATABASE_URL')) {
    success('Verificação de variáveis de ambiente configurada no amplify.yml');
  }
  if (amplifyConfig.includes('NODE_OPTIONS')) {
    success('Configuração de memória Node.js presente');
  }
} catch (err) {
  error('amplify.yml não encontrado');
}

// 7. Verificar se existe documentação de segurança
info('Verificando documentação...');
const docsToCheck = ['.env.example', 'DEPLOY_AWS_AMPLIFY.md'];
docsToCheck.forEach(doc => {
  if (fs.existsSync(doc)) {
    success(`Documentação ${doc} presente`);
  } else {
    warning(`Documentação ${doc} ausente`);
  }
});

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  log('red', '🚨 FALHA NA VERIFICAÇÃO DE SEGURANÇA');
  log('red', 'Corrija os erros antes de fazer deploy para produção!');
  process.exit(1);
} else if (hasWarnings) {
  log('yellow', '⚠️  VERIFICAÇÃO CONCLUÍDA COM AVISOS');
  log('yellow', 'Revise os avisos antes do deploy');
} else {
  log('green', '🎉 VERIFICAÇÃO DE SEGURANÇA PASSOU!');
  log('green', 'Sistema pronto para deploy na AWS Amplify');
}

log('cyan', '\nPróximos passos:');
log('cyan', '1. Configure as variáveis de ambiente no console AWS Amplify');
log('cyan', '2. Faça commit das alterações de segurança');
log('cyan', '3. Inicie o deploy no AWS Amplify');
log('cyan', '4. Monitore os logs de build para verificar sucesso');

console.log('\n' + '='.repeat(50)); 