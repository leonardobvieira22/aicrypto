import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// Função para verificar se o Prisma está disponível
const isPrismaAvailable = () => {
  try {
    return prisma && typeof prisma.user !== 'undefined'
  } catch (error) {
    console.log('[AUTH] Prisma não disponível:', error)
    return false
  }
}

// Usuários de demonstração para desenvolvimento
const demoUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2b$12$8Ok4UG4/ca1cBHe9OaoCt.1jL2C6J3t9fPdJwFlmznG56QlHFMLBi', // admin123
    image: 'https://avatars.githubusercontent.com/u/1?v=4',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Usuário Demo',
    email: 'demo@example.com',
    password: '$2b$12$4OUKJNWuM4YbcqnBaEjTnuzU3XP8d7mGeOEPJxgMpZDfESwYsuo3O', // demo123
    image: 'https://avatars.githubusercontent.com/u/2?v=4',
    role: 'USER',
  }
];

// Configuração base do NextAuth
const baseAuthOptions: NextAuthOptions = {
  // Usar JWT para sessões (mais confiável para desenvolvimento)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  // Páginas customizadas
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  // Configuração de segurança
  secret: process.env.NEXTAUTH_SECRET || 'default-secret-for-development',
  debug: process.env.NODE_ENV === 'development',

  // Provedores de autenticação
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Credenciais não fornecidas');
          throw new Error('MISSING_CREDENTIALS');
        }

        console.log(`[AUTH] Tentativa de login para: ${credentials.email}`);

        try {
          // Verificar credenciais hardcoded primeiro (para desenvolvimento e testes)
          const demoUser = demoUsers.find(u => u.email === credentials.email);

          if (demoUser) {
            console.log('[AUTH] Usuário demo encontrado');
            console.log('[AUTH] Verificando senha...');
            
            const passwordMatch = await bcrypt
              .compare(credentials.password, demoUser.password)
              .catch((err) => {
                console.error('[AUTH] Erro ao comparar senha demo:', err);
                return false;
              });

            console.log('[AUTH] Resultado da comparação:', passwordMatch);

            if (passwordMatch) {
              console.log('[AUTH] Login demo bem-sucedido');
              return {
                id: demoUser.id,
                name: demoUser.name,
                email: demoUser.email,
                image: demoUser.image,
                role: demoUser.role,
              }
            } else {
              console.log('[AUTH] Senha demo inválida');
              throw new Error('INVALID_PASSWORD');
            }
          }

          // Se não for um usuário de demonstração e o Prisma estiver disponível, tenta verificar no banco de dados
          if (isPrismaAvailable()) {
            console.log('[AUTH] Verificando usuário no banco de dados');
            try {
              // Verificar usuário no banco de dados
              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
              });

              if (!user) {
                console.log('[AUTH] Usuário não encontrado no banco');
                throw new Error('USER_NOT_FOUND');
              }

              if (!user.password) {
                console.log('[AUTH] Usuário sem senha (talvez OAuth)');
                throw new Error('NO_PASSWORD_SET');
              }

              // Verificar se o email foi verificado (exceto usuários de demonstração/admin)
              if (!user.emailVerified && user.role !== 'ADMIN') {
                console.log('[AUTH] Email não verificado');
                throw new Error('email_not_verified');
              }

              // Verificar se a conta está ativa
              if (!user.isActive) {
                console.log('[AUTH] Conta inativa');
                throw new Error('ACCOUNT_SUSPENDED');
              }

              // Verificar se a senha está correta
              const isPasswordValid = await bcrypt.compare(
                credentials.password,
                user.password
              );

              if (!isPasswordValid) {
                console.log('[AUTH] Senha inválida para usuário do banco');
                throw new Error('INVALID_PASSWORD');
              }

              console.log('[AUTH] Login do banco bem-sucedido');
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
              }
            } catch (dbError) {
              console.error('[AUTH] Erro ao verificar usuário no banco de dados:', dbError);
              
              // Se o erro foi lançado por nós, re-throw
              if (dbError instanceof Error && ['USER_NOT_FOUND', 'NO_PASSWORD_SET', 'email_not_verified', 'ACCOUNT_SUSPENDED', 'INVALID_PASSWORD'].includes(dbError.message)) {
                throw dbError;
              }
              
              // Para erros de conexão/sistema, lançar erro de database
              throw new Error('DATABASE_ERROR');
            }
          } else {
            console.log('[AUTH] Prisma não disponível e usuário não é demo');
            throw new Error('USER_NOT_FOUND');
          }
        } catch (error) {
          console.error('[AUTH] Erro na autenticação:', error);
          
          // Se já é um erro nosso, re-throw
          if (error instanceof Error) {
            throw error;
          }
          
          // Para erros desconhecidos
          throw new Error('UNKNOWN_ERROR');
        }
      },
    }),
  ],

  // Callbacks
  callbacks: {
    async session({ session, token }) {
      // Adiciona o ID do usuário à sessão
      if (token.sub) {
        session.user.id = token.sub;

        // Adiciona o papel do usuário à sessão
        if (token.role) {
          session.user.role = token.role as string;
        } else {
          // Tenta encontrar o papel nos usuários de demonstração primeiro
          const demoUser = demoUsers.find(u => u.id === token.sub);
          if (demoUser) {
            session.user.role = demoUser.role;
          } else if (isPrismaAvailable()) {
            // Tenta buscar o papel do usuário do banco de dados
            try {
              const user = await prisma.user.findUnique({
                where: { id: token.sub },
                select: { role: true },
              });

              if (user) {
                session.user.role = user.role;
              } else {
                // Default para USER se não conseguir buscar
                session.user.role = 'USER';
              }
            } catch (error) {
              console.error('Erro ao buscar papel do usuário:', error);
              // Default para USER se houver erro
              session.user.role = 'USER';
            }
          } else {
            // Default para USER se Prisma não estiver disponível
            session.user.role = 'USER';
          }
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // Adiciona dados do usuário ao token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
};

// Adicionar o PrismaAdapter apenas se estiver disponível
let authOptions = baseAuthOptions;

if (isPrismaAvailable()) {
  try {
    const { PrismaAdapter } = require('@auth/prisma-adapter')
    authOptions = {
      ...baseAuthOptions,
      adapter: PrismaAdapter(prisma),
    }
    console.log('[AUTH] PrismaAdapter configurado com sucesso')
  } catch (error) {
    console.log('[AUTH] Erro ao configurar PrismaAdapter, usando configuração JWT:', error)
  }
} else {
  console.log('[AUTH] Usando configuração JWT sem PrismaAdapter')
}

/**
 * Opções de configuração do NextAuth
 */
export { authOptions }

// Manipulador de rota para o NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
