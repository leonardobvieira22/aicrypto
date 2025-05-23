import NextAuth, { type NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// Usuários de demonstração para desenvolvimento
const demoUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2b$10$IoDE05GNcmazS0RSIywn6ucGWKiCv826Fa9.N.KOjne7B71ndAFAK', // admin123
    image: 'https://avatars.githubusercontent.com/u/1?v=4',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Usuário Demo',
    email: 'demo@example.com',
    password: '$2b$10$WM8JyFNvaFRc2UIlxqAAaebM0yXs0r/Nb.X23PdTOD0TCugHlzb3e', // demo123
    image: 'https://avatars.githubusercontent.com/u/2?v=4',
    role: 'USER',
  }
];

/**
 * Opções de configuração do NextAuth
 */
export const authOptions: NextAuthOptions = {
  // Usar o adaptador Prisma para Next-Auth quando possível
  adapter: PrismaAdapter(prisma),

  // Usar JWT para sessões
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
  secret: process.env.NEXTAUTH_SECRET,
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
            console.log('[AUTH] Senha fornecida:', credentials.password);
            console.log('[AUTH] Hash armazenado:', demoUser.password);
            
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

          // Se não for um usuário de demonstração, tenta verificar no banco de dados
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
          } else {
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

// Manipulador de rota para o NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
