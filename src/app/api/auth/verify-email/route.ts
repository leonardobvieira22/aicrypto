import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/config/database'
import { validateToken } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    // Processar corpo da requisição
    const body = await req.json()

    // Validar dados de entrada
    const validation = validateToken(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { message: 'Token inválido', errors: validation.errors },
        { status: 400 }
      )
    }

    const { token } = body

    // Buscar usuário pelo token de verificação
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date() // Token ainda não expirou
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Link de verificação inválido ou expirado. Solicite um novo email de verificação.' },
        { status: 400 }
      )
    }

    // Atualizar usuário como verificado
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }
    })

    return NextResponse.json(
      { message: 'Email verificado com sucesso! Você já pode fazer login na plataforma.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao verificar email:', error)
    return NextResponse.json(
      { message: 'Erro interno ao processar sua solicitação' },
      { status: 500 }
    )
  }
}
