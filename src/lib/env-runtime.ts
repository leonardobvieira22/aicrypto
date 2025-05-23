// Configuração de variáveis de ambiente para runtime em produção
// Este arquivo garantirá que as configurações corretas sejam usadas em produção

const isProduction = process.env.NODE_ENV === 'production';
const isAWSLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isAmplifyRuntime = !!process.env.AWS_REGION && !process.env.AMPLIFY_BUILD;

// Log do ambiente detectado
console.log('🔍 [ENV-RUNTIME] Ambiente detectado:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction,
  isAWSLambda,
  isAmplifyRuntime,
  hasPostgreSQL: process.env.DATABASE_URL?.includes('postgresql://'),
  amplifyBuild: process.env.AMPLIFY_BUILD
});

// Se estivermos em runtime de produção no Amplify, garantir que use PostgreSQL
if (isProduction && isAmplifyRuntime) {
  console.log('🚀 [ENV-RUNTIME] Configurando ambiente de produção Amplify...');
  
  // Garantir que a DATABASE_URL seja PostgreSQL se não estiver configurada
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('postgresql://')) {
    console.log('⚠️ [ENV-RUNTIME] DATABASE_URL não configurada para PostgreSQL, usando configuração padrão...');
    process.env.DATABASE_URL = "postgresql://neondb_owner:npg_pPqF8uoE6KYn@ep-gentle-boat-a56xil4c-pooler.us-east-2.aws.neon.tech/crypto_trading_db?sslmode=require";
  }
  
  // Garantir que NEXTAUTH_URL esteja configurada
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = "https://main.d34l4lklofiz4e.amplifyapp.com";
  }
  
  // Garantir que EMAIL_FROM esteja configurada corretamente
  if (!process.env.EMAIL_FROM || process.env.EMAIL_FROM.includes('trial-yzkq340ppqn4d0re')) {
    process.env.EMAIL_FROM = "noreply@test-dnvo4d9mxy6g5r86.mlsender.net";
  }
  
  // Garantir que ADMIN_EMAIL esteja configurada
  if (!process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL = "leonardobvieira22@gmail.com";
  }
  
  // Garantir que NEXT_PUBLIC_APP_URL esteja configurada
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    process.env.NEXT_PUBLIC_APP_URL = "https://main.d34l4lklofiz4e.amplifyapp.com";
  }
  
  console.log('✅ [ENV-RUNTIME] Configurações de produção aplicadas');
}

export const envConfig = {
  isProduction,
  isAWSLambda,
  isAmplifyRuntime,
  databaseUrl: process.env.DATABASE_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  emailFrom: process.env.EMAIL_FROM,
  adminEmail: process.env.ADMIN_EMAIL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
};

export default envConfig; 