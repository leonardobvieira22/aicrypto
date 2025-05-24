import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/config/database'
import { validateResetPassword } from '@/lib/utils/validation'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  try {
    // Processar corpo da requisição
    const body = await req.json()

    // Validar dados de entrada
    const validation = validateResetPassword(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.errors },
        { status: 400 }
      )
    }

    const { token, password } = body

    // Buscar usuário pelo token de redefinição
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date() // Token ainda é válido
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado. Solicite uma nova redefinição de senha.' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha e limpar tokens de redefinição
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }
    })

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso. Você já pode fazer login com sua nova senha.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao processar redefinição de senha:', error)
    return NextResponse.json(
      { message: 'Erro interno ao processar sua solicitação' },
      { status: 500 }
    )
  }
}
