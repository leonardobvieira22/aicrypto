import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Middleware para todas as rotas
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pular middleware para rotas de API
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Pular middleware para arquivos estáticos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    // Verificar token (se o usuário está autenticado)
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    const isAuthenticated = !!token

    // Redirecionar usuários autenticados tentando acessar páginas de autenticação
    if (
      isAuthenticated &&
      pathname.startsWith('/auth') &&
      !pathname.includes('/logout')
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Verificar acesso a rotas protegidas (/dashboard)
    if (!isAuthenticated && pathname.startsWith('/dashboard')) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Verificar acesso a rotas protegidas (/admin)
    if (pathname.startsWith('/admin')) {
      if (!isAuthenticated) {
        const url = new URL('/auth/login', request.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }

      const userRole = token?.role
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('[MIDDLEWARE] Erro:', error)
    // Em caso de erro, permitir acesso
    return NextResponse.next()
  }
}

// Configuração para especificar em quais rotas o middleware será executado
export const config = {
  matcher: [
    // Incluir todas as rotas exceto API, _next e arquivos estáticos
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
