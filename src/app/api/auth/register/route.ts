import { type NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import { isValidCPF, isValidCPFFormat, cleanCPF, isAtLeast18YearsOld } from '@/lib/utils/validation'

// Configurar ambiente de runtime para produção
import '@/lib/env-runtime'

// Interface para os dados de registro
interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  dateOfBirth: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

// Interface para erros de validação
interface ValidationError {
  path: string;
  message: string;
}

// Função para validar email
function isValidEmail(email: string): boolean {
  if (!email || email.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Função para validar nome
function isValidName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 100) return false;
  return /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
}

// Função para validar senha
function isValidPassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Senha é obrigatória');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) errors.push('Senha deve ter pelo menos 8 caracteres');
  if (password.length > 72) errors.push('Senha não pode ter mais de 72 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Senha deve conter pelo menos uma letra maiúscula');
  if (!/[a-z]/.test(password)) errors.push('Senha deve conter pelo menos uma letra minúscula');
  if (!/[0-9]/.test(password)) errors.push('Senha deve conter pelo menos um número');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Senha deve conter pelo menos um caractere especial');
  
  return { isValid: errors.length === 0, errors };
}

// Função para validar data de nascimento
function isValidDateOfBirth(date: string): boolean {
  try {
    const birthDate = new Date(date);
    if (isNaN(birthDate.getTime())) return false;
    return isAtLeast18YearsOld(date);
  } catch {
    return false;
  }
}

// Função principal de validação
function validateRegisterData(data: any): { isValid: boolean; errors: ValidationError[]; data?: RegisterData } {
  const errors: ValidationError[] = [];

  // Validar estrutura básica
  if (!data || typeof data !== 'object') {
    errors.push({ path: 'root', message: 'Dados inválidos' });
    return { isValid: false, errors };
  }

  const {
    name,
    email,
    password,
    confirmPassword,
    cpf: rawCpf,
    dateOfBirth,
    termsAccepted,
    privacyAccepted
  } = data;

  // Validar nome
  if (!isValidName(name)) {
    if (!name) {
      errors.push({ path: 'name', message: 'Nome é obrigatório' });
    } else if (name.length < 3) {
      errors.push({ path: 'name', message: 'Nome deve ter pelo menos 3 caracteres' });
    } else if (name.length > 100) {
      errors.push({ path: 'name', message: 'Nome não pode ter mais de 100 caracteres' });
    } else {
      errors.push({ path: 'name', message: 'Nome deve conter apenas letras e espaços' });
    }
  }

  // Validar email
  if (!isValidEmail(email)) {
    if (!email) {
      errors.push({ path: 'email', message: 'Email é obrigatório' });
    } else {
      errors.push({ path: 'email', message: 'Email inválido' });
    }
  }

  // Validar senha
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.isValid) {
    passwordValidation.errors.forEach(error => {
      errors.push({ path: 'password', message: error });
    });
  }

  // Validar confirmação de senha
  if (password !== confirmPassword) {
    errors.push({ path: 'confirmPassword', message: 'As senhas não coincidem' });
  }

  // Validar CPF
  if (!rawCpf) {
    errors.push({ path: 'cpf', message: 'CPF é obrigatório' });
  } else {
    const cleanedCPF = cleanCPF(rawCpf);
    if (cleanedCPF.length !== 11) {
      errors.push({ path: 'cpf', message: 'CPF deve conter 11 dígitos' });
    } else if (!isValidCPF(rawCpf)) {
      errors.push({ path: 'cpf', message: 'CPF inválido' });
    }
  }

  // Validar data de nascimento
  if (!isValidDateOfBirth(dateOfBirth)) {
    if (!dateOfBirth) {
      errors.push({ path: 'dateOfBirth', message: 'Data de nascimento é obrigatória' });
    } else {
      errors.push({ path: 'dateOfBirth', message: 'Você deve ter pelo menos 18 anos para se registrar' });
    }
  }

  // Validar termos e condições
  if (termsAccepted !== true) {
    errors.push({ path: 'termsAccepted', message: 'Você deve aceitar os termos e condições' });
  }

  // Validar política de privacidade
  if (privacyAccepted !== true) {
    errors.push({ path: 'privacyAccepted', message: 'Você deve aceitar a política de privacidade' });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      confirmPassword,
      cpf: cleanCPF(rawCpf),
      dateOfBirth,
      termsAccepted,
      privacyAccepted
    }
  };
}

export async function POST(req: NextRequest) {
  console.log('🚀 [REGISTER] Iniciando processo de registro...');
  
  try {
    // Verificar limite de taxa
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    console.log(`📍 [REGISTER] IP do cliente: ${ipAddress}`);
    
    // Processar corpo da requisição
    let body: any;
    try {
      body = await req.json();
      console.log('📦 [REGISTER] Corpo da requisição processado');
    } catch (error: any) {
      console.error('❌ [REGISTER] Erro ao processar JSON:', error.message);
      return NextResponse.json(
        { message: 'Formato de requisição inválido' },
        { status: 400 }
      );
    }

    // Validar dados de entrada
    const validation = validateRegisterData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          message: 'Dados de cadastro inválidos', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const {
      name: sanitizedName,
      email: normalizedEmail,
      password,
      cpf,
      dateOfBirth,
      termsAccepted,
      privacyAccepted
    } = validation.data!;

    // Verificar se o usuário já existe pelo email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    }).catch((error: any) => {
      console.error('Erro ao verificar email existente:', error);
      return null;
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se o CPF já está cadastrado
    const existingCPF = await prisma.user.findUnique({
      where: { cpf },
    }).catch((error: any) => {
      console.error('Erro ao verificar CPF existente:', error);
      return null;
    });

    if (existingCPF) {
      return NextResponse.json(
        { message: 'CPF já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (error: any) {
      console.error('Erro ao gerar hash da senha:', error);
      return NextResponse.json(
        { message: 'Erro ao processar senha' },
        { status: 500 }
      );
    }

    // Gerar token criptograficamente seguro
    const verificationToken = randomUUID();
    
    // Criar usuário em transação para garantir consistência
    try {
      console.log('💾 [REGISTER] Iniciando transação do banco de dados...');
      
      const user = await prisma.$transaction(async (tx: any) => {
        console.log('👤 [REGISTER] Criando usuário...');
        
        // Criar usuário
        const newUser = await tx.user.create({
          data: {
            name: sanitizedName,
            email: normalizedEmail,
            password: hashedPassword,
            cpf,
            dateOfBirth: new Date(dateOfBirth),
            termsAccepted,
            privacyAccepted,
            isActive: true,
            // Criar token de verificação de email
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
          },
        });
        
        console.log(`✅ [REGISTER] Usuário criado: ${newUser.id}`);
        
        console.log('⚙️ [REGISTER] Criando configurações de trading...');
        
        // Criar configurações padrão para o usuário
        await tx.tradingSetting.create({
          data: {
            userId: newUser.id,
            riskLevel: 'MEDIUM',
            defaultOrderSize: 5.0,
            maxOpenPositions: 5,
            defaultLeverage: 1.0,
            enableStopLoss: true,
            stopLossPercentage: 5.0,
            enableTakeProfit: true,
            takeProfitPercentage: 15.0,
            tradingPairs: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
          },
        });

        console.log('💰 [REGISTER] Criando carteira de paper trading...');

        // Criar carteira de paper trading para o usuário
        await tx.paperTradingWallet.create({
          data: {
            userId: newUser.id,
            balance: 10000.0,
            equity: 10000.0,
            openPositionsJson: JSON.stringify([]),
            historyJson: JSON.stringify([]),
          },
        });

        console.log('🔔 [REGISTER] Criando preferências de notificação...');

        // Criar preferências de notificação para o usuário
        await tx.notificationPreferences.create({
          data: {
            userId: newUser.id,
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            emailFrequency: 'INSTANT',
            marketUpdates: true,
            tradeAlerts: true,
            securityAlerts: true,
            newsAlerts: false,
            priceAlerts: true,
            robotAlerts: true,
            subscriptionAlerts: true,
            quietHoursEnabled: false,
            timezone: 'UTC',
          },
        });
        
        console.log('🎉 [REGISTER] Transação concluída com sucesso!');
        return newUser;
      });

      // Enviar email de verificação usando o serviço de email
      try {
        const { emailService } = await import('@/lib/services/emailService');

        // Construir a URL de verificação
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

        // Enviar email de verificação
        await emailService.sendVerificationEmail({
          to: normalizedEmail,
          name: sanitizedName || 'Usuário',
          verificationUrl,
          userId: user.id
        });

      } catch (emailError: any) {
        console.error('Erro ao enviar email de verificação:', emailError);
        // Não interrompe o fluxo, mas registra o erro
      }

      // Registrar evento de auditoria - removido para evitar erros em produção
      // O auditLog pode não estar disponível em todos os ambientes
      console.log(`✅ Usuário registrado com sucesso: ${user.email} (ID: ${user.id})`);

      // Remover a senha e o token de verificação do objeto de retorno
      const { password: __, emailVerificationToken: ___, ...userWithoutSensitiveData } = user;

      return NextResponse.json(
        {
          message: 'Usuário criado com sucesso. Por favor, verifique seu email para ativar sua conta.',
          user: userWithoutSensitiveData,
          requiresEmailVerification: true,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('❌ [REGISTER] Erro de banco de dados ao criar usuário:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        stack: dbError.stack?.split('\n').slice(0, 5).join('\n') // Primeiras 5 linhas do stack
      });
      
      // Verificar tipos específicos de erro
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { message: 'Email ou CPF já cadastrado' },
          { status: 400 }
        );
      }
      
      if (dbError.code === 'P1001') {
        return NextResponse.json(
          { message: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { message: 'Erro ao criar usuário. Por favor, tente novamente.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { message: 'Erro interno ao processar sua solicitação' },
      { status: 500 }
    );
  }
}
