import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Rota de debug acessada');
    
    // Verificar variáveis de ambiente básicas
    const envInfo: {
      NODE_ENV: string | undefined;
      AWS_REGION: string | undefined;
      AWS_LAMBDA_FUNCTION_NAME: string | undefined;
      AMPLIFY_BUILD: string | undefined;
      hasPostgreSQL: boolean;
      timestamp: string;
      prismaImport: string;
    } = {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
      AMPLIFY_BUILD: process.env.AMPLIFY_BUILD,
      hasPostgreSQL: !!process.env.DATABASE_URL?.includes('postgresql://'),
      timestamp: new Date().toISOString(),
      prismaImport: 'TESTING'
    };
    
    console.log('🔍 [DEBUG] Environment info:', envInfo);
    
    // Testar import do Prisma sem usar
    try {
      const prismaModule = await import('@/lib/prisma');
      console.log('✅ [DEBUG] Prisma module imported successfully');
      envInfo.prismaImport = 'SUCCESS';
    } catch (error: any) {
      console.error('❌ [DEBUG] Prisma import failed:', error.message);
      envInfo.prismaImport = `FAILED: ${error.message}`;
    }
    
    return NextResponse.json({
      status: 'OK',
      message: 'Debug route working',
      environment: envInfo,
      runtime: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ [DEBUG] Error in debug route:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
} 