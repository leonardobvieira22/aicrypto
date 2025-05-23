import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Configurar ambiente de runtime para produção
import '@/lib/env-runtime'

export async function GET(req: NextRequest) {
  console.log('🧪 [TEST-DB] Iniciando teste de banco de dados...');

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
      AMPLIFY_BUILD: process.env.AMPLIFY_BUILD,
      DATABASE_URL: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.split('@')[0]}@***` : 'NOT SET'
    },
    tests: {
      prismaConnection: 'PENDING',
      userQuery: 'PENDING',
      userCreate: 'PENDING',
      transactionTest: 'PENDING'
    },
    errors: [] as string[]
  };

  try {
    // Teste 1: Verificar se Prisma Client está inicializado
    console.log('🔍 [TEST-DB] Teste 1: Verificando Prisma Client...');
    if (!prisma) {
      diagnostics.tests.prismaConnection = 'FAILED - Prisma Client não inicializado';
      diagnostics.errors.push('Prisma Client é null/undefined');
    } else {
      diagnostics.tests.prismaConnection = 'SUCCESS';
      console.log('✅ [TEST-DB] Prisma Client inicializado');
    }

    // Teste 2: Tentar fazer uma query simples
    console.log('🔍 [TEST-DB] Teste 2: Testando query de usuário...');
    try {
      const userCount = await prisma.user.count();
      diagnostics.tests.userQuery = `SUCCESS - ${userCount} usuários encontrados`;
      console.log(`✅ [TEST-DB] Query executada: ${userCount} usuários`);
    } catch (queryError: any) {
      diagnostics.tests.userQuery = `FAILED - ${queryError.message}`;
      diagnostics.errors.push(`Query error: ${queryError.message}`);
      console.error('❌ [TEST-DB] Erro na query:', queryError);
    }

    // Teste 3: Tentar criar um usuário temporário (e deletar)
    console.log('🔍 [TEST-DB] Teste 3: Testando criação/deleção de usuário...');
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      
      // Criar usuário de teste
      const testUser = await prisma.user.create({
        data: {
          name: 'Teste Diagnóstico',
          email: testEmail,
          password: 'temp_password_hash',
          cpf: '00000000000',
          dateOfBirth: new Date('1990-01-01'),
          termsAccepted: true,
          privacyAccepted: true,
          isActive: true
        }
      });

      console.log(`✅ [TEST-DB] Usuário criado: ${testUser.id}`);

      // Deletar usuário de teste
      await prisma.user.delete({
        where: { id: testUser.id }
      });

      diagnostics.tests.userCreate = `SUCCESS - Criado e deletado usuário ${testUser.id}`;
      console.log('✅ [TEST-DB] Usuário deletado com sucesso');
      
    } catch (createError: any) {
      diagnostics.tests.userCreate = `FAILED - ${createError.message}`;
      diagnostics.errors.push(`Create error: ${createError.message}`);
      console.error('❌ [TEST-DB] Erro na criação:', createError);
    }

    // Teste 4: Testar transação
    console.log('🔍 [TEST-DB] Teste 4: Testando transação...');
    try {
      await prisma.$transaction(async (tx: any) => {
        const count = await tx.user.count();
        console.log(`✅ [TEST-DB] Transação executada: ${count} usuários`);
        return count;
      });
      
      diagnostics.tests.transactionTest = 'SUCCESS';
      console.log('✅ [TEST-DB] Transação executada com sucesso');
      
    } catch (txError: any) {
      diagnostics.tests.transactionTest = `FAILED - ${txError.message}`;
      diagnostics.errors.push(`Transaction error: ${txError.message}`);
      console.error('❌ [TEST-DB] Erro na transação:', txError);
    }

    console.log('🎉 [TEST-DB] Diagnóstico concluído');

    return NextResponse.json({
      status: 'completed',
      diagnostics,
      summary: diagnostics.errors.length === 0 ? 'Todos os testes passaram' : `${diagnostics.errors.length} erro(s) encontrado(s)`
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 [TEST-DB] Erro crítico no diagnóstico:', error);
    
    diagnostics.errors.push(`Critical error: ${error.message}`);
    
    return NextResponse.json({
      status: 'error',
      diagnostics,
      criticalError: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      }
    }, { status: 500 });
  }
} 