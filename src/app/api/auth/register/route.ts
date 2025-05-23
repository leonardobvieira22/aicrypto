import '@/lib/env-runtime'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  console.log('🔍 [REGISTER] Rota de registro acessada');
  
  try {
    // Teste básico primeiro - sem Prisma
    console.log('🔍 [REGISTER] Testando funcionalidade básica...');
    
    const body = await req.json();
    console.log('🔍 [REGISTER] Body recebido:', { email: body.email, hasPassword: !!body.password });
    
    // Validações básicas
    if (!body.email || !body.password || !body.name) {
      console.log('❌ [REGISTER] Dados obrigatórios ausentes');
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Teste de hash de senha
    console.log('🔍 [REGISTER] Testando hash de senha...');
    const hashedPassword = await bcrypt.hash(body.password, 12);
    console.log('✅ [REGISTER] Hash de senha criado com sucesso');
    
    // Verificar variáveis de ambiente
    console.log('🔍 [REGISTER] Verificando ambiente...');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME);
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENTE' : 'AUSENTE');
    
    // Por enquanto, retornar sucesso sem salvar no banco
    console.log('✅ [REGISTER] Teste básico concluído com sucesso');
    
    return NextResponse.json({
      message: 'Teste de registro bem-sucedido',
      user: {
        id: 'test-' + Date.now(),
        name: body.name,
        email: body.email,
        role: 'USER'
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ [REGISTER] Erro na rota de registro:', error);
    console.error('❌ [REGISTER] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
