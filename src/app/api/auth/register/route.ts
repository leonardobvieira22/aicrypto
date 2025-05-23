import '@/lib/env-runtime'
import { type NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'

// Verificar se as funções de validação existem
let validationFunctions: any = {};
try {
  const validation = require('@/lib/utils/validation');
  validationFunctions = validation;
  console.log('✅ [REGISTER] Funções de validação carregadas com sucesso');
} catch (error: any) {
  console.error('❌ [REGISTER] Erro ao carregar funções de validação:', error.message);
  // Fallback para validações básicas
}

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

// Funções de validação locais
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function isValidCPF(cpf: string): boolean {
  try {
    if (validationFunctions.isValidCPF) {
      return validationFunctions.isValidCPF(cpf);
    }
    // Fallback: apenas verificar se tem 11 dígitos
    const cleaned = cleanCPF(cpf);
    return cleaned.length === 11 && !/^(\d)\1{10}$/.test(cleaned);
  } catch (error) {
    console.error('Erro na validação de CPF:', error);
    return false;
  }
}

function isAtLeast18YearsOld(date: string): boolean {
  try {
    if (validationFunctions.isAtLeast18YearsOld) {
      return validationFunctions.isAtLeast18YearsOld(date);
    }
    // Fallback: validação básica
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  } catch (error) {
    console.error('Erro na validação de idade:', error);
    return false;
  }
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
  console.log('🔍 [REGISTER] Ambiente detectado:', {
    NODE_ENV: process.env.NODE_ENV,
    AWS_REGION: process.env.AWS_REGION,
    AWS_LAMBDA_FUNCTION_NAME: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
    AMPLIFY_BUILD: process.env.AMPLIFY_BUILD,
    hasPostgreSQL: process.env.DATABASE_URL?.includes('postgresql://'),
    prismaExists: !!prisma
  });
  
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
    console.log('🔍 [REGISTER] Iniciando validação de dados...');
    const validation = validateRegisterData(body);
    if (!validation.isValid) {
      console.log('❌ [REGISTER] Validação falhou:', validation.errors);
      return NextResponse.json(
        { 
          message: 'Dados de cadastro inválidos', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }
    console.log('✅ [REGISTER] Validação de dados bem-sucedida');
    
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
    console.log('🔍 [REGISTER] Verificando email existente...');
    console.log('🔍 [REGISTER] Testando conexão Prisma...');
    console.log('🔍 [REGISTER] DATABASE_URL presente:', !!process.env.DATABASE_URL);
    console.log('🔍 [REGISTER] DATABASE_URL tipo:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    try {
      // Configurar timeout específico para AWS Lambda
      const LAMBDA_TIMEOUT = 5000; // 5 segundos
      
      console.log('🔍 [REGISTER] Executando consulta de email com timeout...');
      
      // Usar Promise.race para implementar timeout manual
      const existingEmailPromise = prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true } // Selecionar apenas campos necessários
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), LAMBDA_TIMEOUT);
      });
      
      const existingEmail = await Promise.race([existingEmailPromise, timeoutPromise]) as any;

      if (existingEmail) {
        console.log('❌ [REGISTER] Email já cadastrado');
        return NextResponse.json(
          { message: 'Email já cadastrado' },
          { status: 400 }
        );
      }
      console.log('✅ [REGISTER] Email disponível');
    } catch (error: any) {
      console.error('❌ [REGISTER] Erro ao verificar email existente:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      // Se for timeout, tentar uma estratégia simplificada
      if (error.message === 'TIMEOUT') {
        console.log('⏰ [REGISTER] Timeout na consulta - continuando sem verificação prévia de email');
        console.log('🔄 [REGISTER] O sistema irá capturar duplicatas durante a criação do usuário');
        // Continuar sem verificação prévia - o banco capturará duplicatas
      } else if (error.code === 'P1001' || error.message?.includes('connection')) {
        return NextResponse.json(
          { message: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.' },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          { message: 'Erro ao verificar email. Tente novamente.' },
          { status: 500 }
        );
      }
    }

    // Verificar se o CPF já está cadastrado
    console.log('🔍 [REGISTER] Verificando CPF existente...');
    try {
      // Usar o mesmo timeout para consistência
      const LAMBDA_TIMEOUT = 5000; // 5 segundos
      
      console.log('🔍 [REGISTER] Executando consulta de CPF com timeout...');
      
      const existingCPFPromise = prisma.user.findUnique({
        where: { cpf },
        select: { id: true, cpf: true } // Selecionar apenas campos necessários
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), LAMBDA_TIMEOUT);
      });
      
      const existingCPF = await Promise.race([existingCPFPromise, timeoutPromise]) as any;

      if (existingCPF) {
        console.log('❌ [REGISTER] CPF já cadastrado');
        return NextResponse.json(
          { message: 'CPF já cadastrado' },
          { status: 400 }
        );
      }
      console.log('✅ [REGISTER] CPF disponível');
    } catch (error: any) {
      console.error('❌ [REGISTER] Erro ao verificar CPF existente:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      // Se for timeout, continuar sem verificação prévia
      if (error.message === 'TIMEOUT') {
        console.log('⏰ [REGISTER] Timeout na consulta de CPF - continuando sem verificação prévia');
        console.log('🔄 [REGISTER] O sistema irá capturar duplicatas durante a criação do usuário');
        // Continuar sem verificação prévia - o banco capturará duplicatas
      } else if (error.code === 'P1001' || error.message?.includes('connection')) {
        return NextResponse.json(
          { message: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.' },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          { message: 'Erro ao verificar CPF. Tente novamente.' },
          { status: 500 }
        );
      }
    }

    // Hash da senha
    console.log('🔍 [REGISTER] Gerando hash da senha...');
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
      console.log('✅ [REGISTER] Hash de senha criado com sucesso');
    } catch (error: any) {
      console.error('❌ [REGISTER] Erro ao gerar hash da senha:', error);
      return NextResponse.json(
        { message: 'Erro ao processar senha' },
        { status: 500 }
      );
    }

    // Gerar token criptograficamente seguro
    const verificationToken = randomUUID();
    console.log('✅ [REGISTER] Token de verificação gerado');
    
    // Criar usuário em transação para garantir consistência
    let user: any;
    try {
      console.log('💾 [REGISTER] Iniciando transação do banco de dados...');
      
      user = await prisma.$transaction(async (tx: any) => {
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

      console.log(`✅ [REGISTER] Usuário registrado no banco: ${user.email} (ID: ${user.id})`);

    } catch (dbError: any) {
      console.error('❌ [REGISTER] Erro de banco de dados ao criar usuário:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        stack: dbError.stack?.split('\n').slice(0, 5).join('\n')
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

    // Enviar email de verificação de forma assíncrona (não bloquear o registro)
    // Executar em background para não afetar a resposta ao usuário
    setImmediate(async () => {
      try {
        console.log('📧 [REGISTER] Tentando enviar email de verificação...');
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

        console.log('✅ [REGISTER] Email de verificação enviado com sucesso (background)');

      } catch (emailError: any) {
        console.error('⚠️ [REGISTER] Erro ao enviar email de verificação (background):', emailError);
        // Email falhou, mas não afeta o registro do usuário
      }
    });

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

  } catch (error: any) {
    console.error('❌ [REGISTER] Erro geral ao registrar usuário:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 10).join('\n')
    });
    return NextResponse.json(
      { message: 'Erro interno ao processar sua solicitação' },
      { status: 500 }
    );
  }
}
