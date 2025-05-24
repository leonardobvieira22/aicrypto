// Debug das variáveis de ambiente
console.log('🔍 [DEBUG-ENV] Estado das variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PHASE:', process.env.NEXT_PHASE);
console.log('AWS_AMPLIFY_BUILD:', process.env.AWS_AMPLIFY_BUILD);
console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('NEXTAUTH_URL presente:', !!process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET presente:', !!process.env.NEXTAUTH_SECRET);
console.log('JWT_SECRET presente:', !!process.env.JWT_SECRET);

// Verificar se estamos em build ou runtime
if (process.env.NEXT_PHASE === 'phase-production-build') {
  console.log('🏗️ [DEBUG-ENV] Executando durante o build do Next.js');
} else {
  console.log('🚀 [DEBUG-ENV] Executando em runtime');
}

export const debugEnvironmentVariables = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    nextPhase: process.env.NEXT_PHASE,
    awsAmplifyBuild: process.env.AWS_AMPLIFY_BUILD,
    hasDatabase: !!process.env.DATABASE_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    timestamp: new Date().toISOString(),
  };
}; 