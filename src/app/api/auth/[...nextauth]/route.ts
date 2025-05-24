import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import bcrypt from 'bcrypt'

// Importar Prisma de forma segura
let prisma: any = null
let PrismaAdapter: any = null

// Função para verificar se o Prisma está disponível
const isPrismaAvailable = () => {
  try {
    if (!prisma) {
      prisma = require('@/lib/config/database').prisma
    }
    return prisma && typeof prisma.user !== 'undefined'
  } catch (error) {
    console.log('[AUTH] Prisma não disponível:', error)
    return false
  }
}

// Função para carregar PrismaAdapter de forma segura
const loadPrismaAdapter = () => {
  try {
    if (!PrismaAdapter) {
      PrismaAdapter = require('@auth/prisma-adapter').PrismaAdapter
    }
    return PrismaAdapter
  } catch (error) {
    console.log('[AUTH] PrismaAdapter não disponível:', error)
    return null
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
]

// Configuração base do NextAuth
const baseAuthOptions: NextAuthOptions = {
  // Usar JWT para sessões (mais confiável)
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
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  debug: process.env.NODE_ENV === 'development',

  // Provedores de autenticação
  providers: [
    // OAuth providers (apenas se configurados)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GithubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Credenciais não fornecidas')
            return null
          }

          console.log(`[AUTH] Tentativa de login para: ${credentials.email}`)

          // Verificar credenciais demo primeiro
          const demoUser = demoUsers.find(u => u.email === credentials.email)

          if (demoUser) {
            console.log('[AUTH] Usuário demo encontrado')
            
            try {
              const passwordMatch = await bcrypt.compare(credentials.password, demoUser.password)
              
              if (passwordMatch) {
                console.log('[AUTH] Login demo bem-sucedido')
                return {
                  id: demoUser.id,
                  name: demoUser.name,
                  email: demoUser.email,
                  image: demoUser.image,
                  role: demoUser.role,
                }
              } else {
                console.log('[AUTH] Senha demo inválida')
                return null
              }
            } catch (bcryptError) {
              console.error('[AUTH] Erro ao verificar senha demo:', bcryptError)
              return null
            }
          }

          // Se não for demo e Prisma estiver disponível, verificar no banco
          if (isPrismaAvailable()) {
            console.log('[AUTH] Verificando usuário no banco de dados')
            
            try {
              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  password: true,
                  role: true,
                  isActive: true,
                  emailVerified: true,
                  image: true
                }
              })

              if (!user) {
                console.log('[AUTH] Usuário não encontrado no banco')
                return null
              }

              if (!user.password) {
                console.log('[AUTH] Usuário sem senha (OAuth)')
                return null
              }

              if (!user.isActive) {
                console.log('[AUTH] Conta inativa')
                return null
              }

              // Verificar senha
              const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

              if (!isPasswordValid) {
                console.log('[AUTH] Senha inválida')
                return null
              }

              console.log('[AUTH] Login do banco bem-sucedido')
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
              }
            } catch (dbError) {
              console.error('[AUTH] Erro ao verificar usuário no banco:', dbError)
              return null
            }
          } else {
            console.log('[AUTH] Prisma não disponível e usuário não é demo')
            return null
          }
        } catch (error) {
          console.error('[AUTH] Erro geral na autenticação:', error)
          return null
        }
      },
    }),
  ],

  // Callbacks
  callbacks: {
    async session({ session, token }) {
      try {
        // Adiciona o ID do usuário à sessão
        if (token.sub) {
          session.user.id = token.sub

          // Adiciona o papel do usuário à sessão
          if (token.role) {
            session.user.role = token.role as string
          } else {
            // Buscar papel nos usuários demo
            const demoUser = demoUsers.find(u => u.id === token.sub)
            if (demoUser) {
              session.user.role = demoUser.role
            } else if (isPrismaAvailable()) {
              // Buscar papel no banco
              try {
                const user = await prisma.user.findUnique({
                  where: { id: token.sub },
                  select: { role: true },
                })

                session.user.role = user?.role || 'USER'
              } catch (error) {
                console.error('[AUTH] Erro ao buscar papel do usuário:', error)
                session.user.role = 'USER'
              }
            } else {
              session.user.role = 'USER'
            }
          }
        }
        return session
      } catch (error) {
        console.error('[AUTH] Erro no callback session:', error)
        return session
      }
    },
    
    async jwt({ token, user }) {
      try {
        // Adiciona dados do usuário ao token
        if (user) {
          token.id = user.id
          token.role = user.role
        }
        return token
      } catch (error) {
        console.error('[AUTH] Erro no callback jwt:', error)
        return token
      }
    },
  },
}

// Configurar authOptions com ou sem PrismaAdapter
let authOptions = baseAuthOptions

// Tentar adicionar PrismaAdapter se disponível
if (isPrismaAvailable()) {
  const adapter = loadPrismaAdapter()
  if (adapter && prisma) {
    try {
      authOptions = {
        ...baseAuthOptions,
        adapter: adapter(prisma),
      }
      console.log('[AUTH] PrismaAdapter configurado com sucesso')
    } catch (error) {
      console.log('[AUTH] Erro ao configurar PrismaAdapter:', error)
      console.log('[AUTH] Usando configuração JWT sem adapter')
    }
  } else {
    console.log('[AUTH] PrismaAdapter não disponível, usando JWT')
  }
} else {
  console.log('[AUTH] Prisma não disponível, usando JWT')
}

// Criar handler do NextAuth
const handler = NextAuth(authOptions)

// Exportar configurações e handlers
export { authOptions }
export { handler as GET, handler as POST }
