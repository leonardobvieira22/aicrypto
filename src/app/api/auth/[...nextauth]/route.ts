import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/config/database'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { AuthOptions } from 'next-auth'
import logger from '@/lib/logger'

// Validação de variáveis de ambiente (apenas em runtime, não durante build)
function validateAuthEnvironment() {
  // Durante o build, não validar
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  const errors: string[] = []
  
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET é obrigatória')
  }
  
  if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
    errors.push('NEXTAUTH_URL é obrigatória em produção')
  }
  
  if (errors.length > 0) {
    const errorMessage = `❌ [AUTH] Erro de configuração:\n${errors.map(e => `  - ${e}`).join('\n')}`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

// Validar ambiente apenas em runtime (não durante build)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    validateAuthEnvironment()
  } catch (error) {
    console.error('[AUTH] Erro na validação do ambiente:', error)
    // Em produção, só falhar se realmente estivermos em runtime
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      throw error
    }
  }
}

// Configuração robusta do NextAuth
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.error('[AUTH] Credenciais inválidas fornecidas')
          throw new Error('Credenciais inválidas')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            logger.warn(`[AUTH] Tentativa de login com email não encontrado: ${credentials.email}`)
            throw new Error('Usuário não encontrado')
          }

          if (!user.password) {
            logger.warn(`[AUTH] Usuário ${credentials.email} não tem senha configurada`)
            throw new Error('Conta não configurada com senha')
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            logger.warn(`[AUTH] Senha incorreta para usuário: ${credentials.email}`)
            throw new Error('Senha incorreta')
          }

          if (!user.isActive) {
            logger.warn(`[AUTH] Tentativa de login com conta desativada: ${credentials.email}`)
            throw new Error('Conta desativada')
          }

          logger.info(`[AUTH] Login bem-sucedido para usuário: ${credentials.email}`)
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          logger.error('[AUTH] Erro na autenticação:', error)
          throw error
        }
      }
    }),
    // Providers OAuth opcionais (apenas se as variáveis estiverem configuradas)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      })
    ] : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET
      })
    ] : [])
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        // Log de tentativa de login
        logger.info(`[AUTH] Tentativa de login: ${user.email} via ${account?.provider}`)
        return true
      } catch (error) {
        logger.error('[AUTH] Erro no callback signIn:', error)
        return false
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  // Configurações de segurança para produção
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
