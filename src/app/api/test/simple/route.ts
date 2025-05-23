import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  console.log('✅ [TEST-SIMPLE] Rota de teste simples executada');
  
  return NextResponse.json({
    status: 'success',
    message: 'Rota de teste funcionando!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION || 'N/A',
      hasLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      amplifyBuild: process.env.AMPLIFY_BUILD || 'false'
    }
  }, { status: 200 });
}

export async function POST(req: NextRequest) {
  console.log('✅ [TEST-SIMPLE] Rota POST de teste simples executada');
  
  try {
    const body = await req.json();
    console.log('📦 [TEST-SIMPLE] Body recebido:', body);
    
    return NextResponse.json({
      status: 'success',
      message: 'POST funcionando!',
      receivedData: body,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ [TEST-SIMPLE] Erro ao processar POST:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Erro no POST de teste',
      error: error.message
    }, { status: 500 });
  }
} 