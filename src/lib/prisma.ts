// Mock PrismaClient que implementa as funcionalidades básicas
// Este mock será usado quando o Prisma Client real não puder ser inicializado
class MockPrismaClient {
  // Mock de usuários para teste
  private mockUsers = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      password: '$2b$12$8Ok4UG4/ca1cBHe9OaoCt.1jL2C6J3t9fPdJwFlmznG56QlHFMLBi', // admin123
      cpf: '123.456.789-00',
      dateOfBirth: new Date('1990-01-01'),
      isActive: true,
      termsAccepted: true,
      privacyAccepted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Usuário Demo',
      email: 'demo@example.com',
      role: 'USER',
      password: '$2b$12$4OUKJNWuM4YbcqnBaEjTnuzU3XP8d7mGeOEPJxgMpZDfESwYsuo3O', // demo123
      cpf: '987.654.321-00',
      dateOfBirth: new Date('1995-05-15'),
      isActive: true,
      termsAccepted: true,
      privacyAccepted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  user = {
    findUnique: async (params: { where: { id?: string; email?: string; cpf?: string } }) => {
      console.log('Mock: user.findUnique chamado', params);

      if (params.where.id) {
        return this.mockUsers.find(u => u.id === params.where.id) || null;
      }
      else if (params.where.email) {
        return this.mockUsers.find(u => u.email === params.where.email) || null;
      }
      else if (params.where.cpf) {
        return this.mockUsers.find(u => u.cpf === params.where.cpf) || null;
      }

      return null;
    },

    create: async (params: { data: { email: string; cpf?: string; name?: string; role?: string; password?: string; dateOfBirth?: Date; isActive?: boolean; termsAccepted?: boolean; privacyAccepted?: boolean; [key: string]: unknown } }) => {
      console.log('Mock: user.create chamado', params);

      // Validar se email já existe
      const existingEmail = this.mockUsers.find(u => u.email === params.data.email);
      if (existingEmail) {
        throw new Error('Email já está em uso');
      }

      // Validar se CPF já existe
      if (params.data.cpf) {
        const existingCpf = this.mockUsers.find(u => u.cpf === params.data.cpf);
        if (existingCpf) {
          throw new Error('CPF já está em uso');
        }
      }

      // Criar novo usuário com todos os campos obrigatórios
      const newUser = {
        id: Math.random().toString(36).substring(2, 15),
        name: params.data.name ?? 'Novo Usuário',
        email: params.data.email,
        role: params.data.role ?? 'USER',
        password: params.data.password ?? '',
        cpf: params.data.cpf ?? '',
        dateOfBirth: params.data.dateOfBirth ?? new Date('2000-01-01'),
        isActive: params.data.isActive ?? true,
        termsAccepted: params.data.termsAccepted ?? true,
        privacyAccepted: params.data.privacyAccepted ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // ...outros campos opcionais...
      };

      this.mockUsers.push(newUser);

      return newUser;
    },

    update: async (params: { where: { id: string }; data: { [key: string]: unknown } }) => {
      console.log('Mock: user.update chamado', params);

      const userIndex = this.mockUsers.findIndex(u => u.id === params.where.id);
      if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar o usuário existente
      this.mockUsers[userIndex] = {
        ...this.mockUsers[userIndex],
        ...params.data,
        updatedAt: new Date(),
      };

      return this.mockUsers[userIndex];
    },

    delete: async (params: { where: { id: string } }) => {
      console.log('Mock: user.delete chamado', params);

      const userIndex = this.mockUsers.findIndex(u => u.id === params.where.id);
      if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
      }

      const deletedUser = this.mockUsers[userIndex];
      this.mockUsers.splice(userIndex, 1);

      return deletedUser;
    },

    findFirst: async () => null,
    findMany: async () => [],
    upsert: async (params: any) => ({
      id: 'mock_id',
      ...params.create
    }),
    count: async () => 0,
    deleteMany: async () => ({ count: 0 })
  };

  tradingSetting = {
    create: async (params: { data: { [key: string]: unknown } }) => {
      console.log('Mock: tradingSetting.create chamado', params);
      return {
        id: Math.random().toString(36).substring(2, 15),
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    update: async (params: { where: { id?: string }; data: { [key: string]: unknown } }) => {
      console.log('Mock: tradingSetting.update chamado', params);
      return {
        id: params.where.id || Math.random().toString(36).substring(2, 15),
        ...params.data,
        updatedAt: new Date(),
      };
    },
  };

  paperTradingWallet = {
    create: async (params: { data: { [key: string]: unknown } }) => {
      console.log('Mock: paperTradingWallet.create chamado', params);
      return {
        id: Math.random().toString(36).substring(2, 15),
        ...params.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  };

  notificationPreferences = {
    create: async (params: { data: { [key: string]: unknown } }) => {
      console.log('Mock: notificationPreferences.create chamado', params);
      return {
        id: Math.random().toString(36).substring(2, 15),
        ...params.data,
        updatedAt: new Date(),
      };
    },
  };

  portfolio = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({
      id: `mock_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.data?.userId || 'mock_user_id',
      ...data.data
    }),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0
  };

  trade = {
    findMany: async () => [],
    create: async (data: any) => ({
      id: `mock_${Math.random().toString(36).substr(2, 9)}`,
      ...data.data
    }),
    count: async () => 0
  };

  alert = {
    findMany: async () => [],
    create: async () => ({}),
    count: async () => 0
  };

  auditLog = {
    create: async () => ({}),
    findMany: async () => [],
    count: async () => 0
  };

  // Implementar método $transaction
  $transaction = async (operations: any[]) => {
    // Mock simples: executar todas as operações em sequência
    const results = [];
    for (const operation of operations) {
      if (typeof operation === 'function') {
        results.push(await operation(this));
      } else {
        results.push(operation);
      }
    }
    return results;
  };

  // Métodos de conexão
  $connect = async () => {};
  $disconnect = async () => {};
  
  // Método para queries raw (se necessário)
  $queryRaw = async () => [];
  $executeRaw = async () => 0;
}

// Função que decide se deve usar o Prisma real ou o mock
function getPrismaClient(): PrismaClient {
  // Log detalhado do ambiente para debug do erro 500
  console.log('🔍 [PRISMA] Inicializando Prisma Client...');
  console.log('🔍 [PRISMA] Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME);
  console.log('- AWS_REGION:', process.env.AWS_REGION);
  console.log('- AWS_AMPLIFY_BUILD:', process.env.AWS_AMPLIFY_BUILD);
  console.log('- AMPLIFY_BUILD:', process.env.AMPLIFY_BUILD);
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENTE' : 'AUSENTE');
  console.log('- typeof window:', typeof window);

  // Verificar se estamos no navegador (não suportado pelo Prisma)
  if (typeof window !== 'undefined') {
    console.log('🔍 [PRISMA] Usando PrismaClient mock (browser environment)');
    return new MockPrismaClient() as unknown as PrismaClient;
  }

  // Detectar ambiente AWS Lambda (produção)
  const isAWSLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_REGION);
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('🔍 [PRISMA] Detecção de ambiente:');
  console.log('- isAWSLambda:', isAWSLambda);
  console.log('- isProduction:', isProduction);

  // EM PRODUÇÃO AWS LAMBDA: SEMPRE usar PrismaClient real
  if (isProduction && isAWSLambda) {
    console.log('🚀 [PRISMA] PRODUÇÃO AWS LAMBDA DETECTADA - forçando PrismaClient real');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ [PRISMA] ERRO CRÍTICO: DATABASE_URL não encontrada em produção!');
      throw new Error('DATABASE_URL é obrigatória em produção AWS Lambda');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require('@prisma/client');

      // Objeto global para armazenar a instância do Prisma
      const globalForPrisma = global as unknown as { prisma?: PrismaClient };

      // Criar ou reutilizar instância
      if (!globalForPrisma.prisma) {
        console.log('✅ [PRISMA] Criando nova instância do PrismaClient para produção');
        globalForPrisma.prisma = new PrismaClient({
          log: ['error'],
          datasources: {
            db: {
              url: process.env.DATABASE_URL
            }
          },
          // Configurações específicas para AWS Lambda/Serverless
          // @ts-ignore - Configurações avançadas do Prisma
          __internal: {
            hooks: {},
            engine: {
              // Configurações para ambiente serverless
              connectionLimit: 1,
              poolTimeout: 10,
              requestTimeout: 30000,
              maximumRetries: 3
            }
          }
        });

        // Configurar event handlers para gerenciar conexões
        globalForPrisma.prisma.$on('beforeExit', async () => {
          console.log('🔌 [PRISMA] Disconnecting before Lambda exit');
          await globalForPrisma.prisma?.$disconnect();
        });

        console.log('✅ [PRISMA] Prisma Client inicializado com sucesso para produção');
        console.log(`📊 [PRISMA] Conectado ao banco: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'N/A'}`);
      } else {
        console.log('♻️ [PRISMA] Reutilizando instância existente do PrismaClient');
      }

      return globalForPrisma.prisma;
    } catch (error) {
      console.error('❌ [PRISMA] ERRO CRÍTICO ao inicializar Prisma Client em produção:', error);
      // Em produção, falhar completamente ao invés de usar mock
      throw new Error(`Falha crítica na inicialização do Prisma em produção: ${error}`);
    }
  }

  // Detectar ambiente de BUILD (não runtime)
  const isBuildTime = (
    (process.env.AWS_AMPLIFY_BUILD === 'true' || process.env.AMPLIFY_BUILD === 'true') &&
    !isAWSLambda // Se for Lambda, sempre runtime
  );

  if (isBuildTime) {
    console.log('🏗️ [PRISMA] Detectado ambiente de BUILD do Amplify - usando mock Prisma');
    return new MockPrismaClient() as unknown as PrismaClient;
  }

  // Para desenvolvimento local, verificar se temos DATABASE_URL
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:')) {
    console.log('⚠️ [PRISMA] Desenvolvimento local sem DATABASE_URL válida - usando mock Prisma');
    return new MockPrismaClient() as unknown as PrismaClient;
  }

  // Tentar usar PrismaClient real (desenvolvimento com banco)
  try {
    console.log('🚀 [PRISMA] Inicializando PrismaClient real para desenvolvimento...');
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');

    // Objeto global para armazenar a instância do Prisma
    const globalForPrisma = global as unknown as { prisma?: PrismaClient };

    // Criar ou reutilizar instância
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      console.log('✅ [PRISMA] Prisma Client inicializado com sucesso para desenvolvimento');
      console.log(`📊 [PRISMA] Conectado ao banco: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'N/A'}`);
    }

    return globalForPrisma.prisma;
  } catch (error) {
    console.error('❌ [PRISMA] Erro ao inicializar Prisma Client real:', error);
    console.log('🔄 [PRISMA] Usando PrismaClient mock como fallback');
    return new MockPrismaClient() as unknown as PrismaClient;
  }
}

// Exportar o cliente
const prisma = getPrismaClient();

// Tipo do PrismaClient para compatibilidade
type PrismaClient = any;

export default prisma;

// Substituir require() por import ES6, exceto em arquivos gerados.
// Substituir 'any' por tipos adequados nos métodos do PrismaClient e resultados de queries.
// Usar tipos do Prisma Client.
