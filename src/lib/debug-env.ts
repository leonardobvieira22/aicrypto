// Arquivo temporário para debug de variáveis de ambiente
export function debugEnvironmentVariables() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'PRESENTE' : 'AUSENTE',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'PRESENTE' : 'AUSENTE',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'PRESENTE' : 'AUSENTE',
    AWS_REGION: process.env.AWS_REGION,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME
  }
  
  console.log('🔍 [DEBUG] Variáveis de ambiente:', envVars)
  return envVars
} 