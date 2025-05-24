import * as nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { prisma } from '@/lib/config/database';

// Importar tipos e constantes de email do cliente Prisma
type EmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'SPAM' | 'BLOCKED';
type EmailType = 'VERIFICATION' | 'PASSWORD_RESET' | 'NOTIFICATION' | 'ALERT' | 'TEST' | 'OTHER';

const EmailStatus = {
  PENDING: 'PENDING' as const,
  SENT: 'SENT' as const,
  FAILED: 'FAILED' as const,
  DELIVERED: 'DELIVERED' as const,
  OPENED: 'OPENED' as const,
  CLICKED: 'CLICKED' as const,
  BOUNCED: 'BOUNCED' as const,
  SPAM: 'SPAM' as const,
  BLOCKED: 'BLOCKED' as const
};

const EmailType = {
  VERIFICATION: 'VERIFICATION' as const,
  PASSWORD_RESET: 'PASSWORD_RESET' as const,
  NOTIFICATION: 'NOTIFICATION' as const,
  ALERT: 'ALERT' as const,
  TEST: 'TEST' as const,
  OTHER: 'OTHER' as const
};

// Interfaces para os emails
interface EmailVerificationParams {
  to: string;
  name: string;
  verificationUrl: string;
  userId?: string;
}

interface PasswordResetParams {
  to: string;
  name: string;
  resetUrl: string;
  userId?: string;
}

// Interface para tracking de emails
interface EmailTrackingParams {
  messageId: string;
  status: string;
  details?: string;
}

// Configurações do MailerSend
const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN || 'mlsn.b928d6b97328b42846ba4f9841fa4fbd7b4fbf0e63582d17589e0a0e05c1c3f9';
const MAILERSEND_API_URL = 'https://api.mailersend.com/v1/email';

// Usar o domínio verificado correto do trial
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@test-dnvo4d9mxy6g5r86.mlsender.net';
const DEFAULT_FROM_NAME = 'AI Crypto Trading';

// Email do administrador para contas trial - DEVE SER O EMAIL CADASTRADO NA CONTA MAILERSEND
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'leonardobvieira22@gmail.com';

// Verificar se estamos em modo trial
const IS_TRIAL_MODE = DEFAULT_FROM_EMAIL.includes('test-') || DEFAULT_FROM_EMAIL.includes('.mlsender.net');

/**
 * Registrar log de email no banco de dados
 * @param param0 Parâmetros do log
 */
const logEmailAttempt = async ({
  toEmail,
  toName,
  subject,
  emailType,
  status,
  statusDetails,
  userId
}: {
  toEmail: string;
  toName?: string;
  subject: string;
  emailType: 'VERIFICATION' | 'PASSWORD_RESET' | 'NOTIFICATION' | 'ALERT' | 'TEST' | 'OTHER';
  status: 'PENDING' | 'SENT' | 'FAILED';
  statusDetails?: string;
  userId?: string;
}) => {
  try {
    await prisma.emailLog.create({
      data: {
        toEmail,
        toName,
        subject,
        emailType,
        status,
        statusDetails,
        userId
      }
    });
    console.log(`Log de email registrado: ${status} para ${toEmail} (${emailType})`);
  } catch (error) {
    console.error('Erro ao registrar log de email:', error);
  }
};

/**
 * Atualizar status de um email com base no messageId
 * @param param0 Parâmetros de tracking
 */
const updateEmailStatus = async ({ messageId, status, details }: EmailTrackingParams) => {
  try {
    console.log(`Atualizando status do email ${messageId} para ${status}`);
    // Implementação futura para tracking de mensagens
  } catch (error) {
    console.error('Erro ao atualizar status do email:', error);
  }
};

/**
 * Enviar email usando MailerSend API
 * @param param0 Parâmetros do email
 * @returns Detalhes da resposta da API
 */
const sendMailWithMailerSend = async ({
  to_email,
  to_name,
  subject,
  html,
  text,
  emailType,
  userId
}: {
  to_email: string;
  to_name: string;
  subject: string;
  html: string;
  text: string;
  emailType: 'VERIFICATION' | 'PASSWORD_RESET' | 'NOTIFICATION' | 'ALERT' | 'TEST' | 'OTHER';
  userId?: string;
}) => {
  try {
    console.log(`Enviando email para ${to_email} via MailerSend`);
    
    // Para contas trial, SEMPRE redirecionar para o email do admin
    let finalToEmail = ADMIN_EMAIL;
    let finalToName = `Admin - Destinatário: ${to_name}`;
    let finalSubject = subject;
    
    if (IS_TRIAL_MODE) {
      // Adicionar informações do destinatário original no subject e conteúdo
      finalSubject = `[TRIAL] Para: ${to_email} - ${subject}`;
      
      // Adicionar nota no HTML sobre o modo trial
      html = `
        <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin-bottom: 20px; border-radius: 8px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">🧪 MODO TRIAL - MAILERSEND</h3>
          <p style="margin: 0; color: #856404;">
            <strong>Destinatário original:</strong> ${to_email} (${to_name})<br>
            <strong>Tipo de email:</strong> ${emailType}<br>
            <strong>Sistema:</strong> AI Crypto Trading Platform
          </p>
        </div>
        ${html}
      `;
      
      text = `[MODO TRIAL MAILERSEND]
Destinatário original: ${to_email} (${to_name})
Tipo de email: ${emailType}
Sistema: AI Crypto Trading Platform

=====================================

${text}`;
      
      console.log(`⚠️ Modo trial ativo: redirecionando email de ${to_email} para ${ADMIN_EMAIL}`);
    }

    // Registrar tentativa de envio
    await logEmailAttempt({
      toEmail: to_email, // Manter o email original no log
      toName: to_name,
      subject,
      emailType,
      status: 'PENDING',
      statusDetails: IS_TRIAL_MODE ? `Trial mode: redirecionado para ${finalToEmail}` : undefined,
      userId
    });

    const response = await fetch(MAILERSEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`,
      },
      body: JSON.stringify({
        from: {
          email: DEFAULT_FROM_EMAIL,
          name: DEFAULT_FROM_NAME
        },
        to: [
          {
            email: finalToEmail,
            name: finalToName
          }
        ],
        subject: finalSubject,
        html,
        text
      })
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Erro ao enviar email via MailerSend:', data);
      console.error(`Status: ${response.status} ${response.statusText}`);

      // Registrar falha
      await logEmailAttempt({
        toEmail: to_email,
        toName: to_name,
        subject,
        emailType,
        status: 'FAILED',
        statusDetails: `${response.status} ${response.statusText} - ${JSON.stringify(data)}`,
        userId
      });

      // Fallback para Ethereal em caso de falha
      return sendMailWithEthereal({
        to_email,
        to_name,
        subject,
        html,
        text,
        emailType,
        userId
      });
    }

    const data = await response.json();
    console.log('Email enviado via MailerSend com sucesso:', data);

    // Registrar sucesso
    await logEmailAttempt({
      toEmail: to_email,
      toName: to_name,
      subject,
      emailType,
      status: 'SENT',
      statusDetails: `Message ID: ${data.message_id || 'N/A'}${IS_TRIAL_MODE ? ' (Trial mode)' : ''}`,
      userId
    });

    return data;
  } catch (error) {
    console.error('Exceção ao enviar email via MailerSend:', error);

    // Registrar exceção
    await logEmailAttempt({
      toEmail: to_email,
      toName: to_name,
      subject,
      emailType,
      status: 'FAILED',
      statusDetails: `Exceção: ${(error as Error).message}`,
      userId
    });

    // Fallback para Ethereal
    return sendMailWithEthereal({
      to_email,
      to_name,
      subject,
      html,
      text,
      emailType,
      userId
    });
  }
};

/**
 * Fallback para envio de email usando Ethereal (apenas em desenvolvimento/teste)
 */
const sendMailWithEthereal = async ({
  to_email,
  to_name,
  subject,
  html,
  text,
  emailType,
  userId
}: {
  to_email: string;
  to_name: string;
  subject: string;
  html: string;
  text: string;
  emailType: 'VERIFICATION' | 'PASSWORD_RESET' | 'NOTIFICATION' | 'ALERT' | 'TEST' | 'OTHER';
  userId?: string;
}) => {
  try {
    // Criar conta de teste no Ethereal
    const testAccount = await nodemailer.createTestAccount();
    console.log('Conta de email de teste criada:', testAccount.web);

    // Criar transportador Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_EMAIL}>`,
      to: `"${to_name}" <${to_email}>`,
      subject,
      text,
      html,
    });

    console.log('Email de teste enviado:', info.messageId);
    console.log('URL para visualizar o email: ', nodemailer.getTestMessageUrl(info));

    // Registrar teste bem-sucedido
    await logEmailAttempt({
      toEmail: to_email,
      toName: to_name,
      subject,
      emailType,
      status: 'SENT',
      statusDetails: `Teste Ethereal - URL: ${nodemailer.getTestMessageUrl(info)}`,
      userId
    });

    return info;
  } catch (error) {
    console.error('Erro ao enviar email via Ethereal:', error);

    // Registrar falha no teste
    await logEmailAttempt({
      toEmail: to_email,
      toName: to_name,
      subject,
      emailType,
      status: 'FAILED',
      statusDetails: error instanceof Error ? error.message : 'Erro desconhecido no fallback Ethereal',
      userId
    });

    throw error;
  }
};

/**
 * Serviço de email
 */
export const emailService = {
  /**
   * Enviar email de verificação
   */
  async sendVerificationEmail({ to, name, verificationUrl, userId }: EmailVerificationParams) {
    const html = createVerificationEmailTemplate({ name, verificationUrl });
    const text = createVerificationEmailTextTemplate({ name, verificationUrl });

    console.log(`Iniciando envio de email de verificação para ${to}`);

    return sendMailWithMailerSend({
      to_email: to,
      to_name: name || 'Usuário',
      subject: 'Verificação de Email - AI Crypto Trading',
      html,
      text,
      emailType: 'VERIFICATION',
      userId
    });
  },

  /**
   * Enviar email de redefinição de senha
   */
  async sendPasswordResetEmail({ to, name, resetUrl, userId }: PasswordResetParams) {
    const html = createPasswordResetEmailTemplate({ name, resetUrl });
    const text = createPasswordResetEmailTextTemplate({ name, resetUrl });

    console.log(`Iniciando envio de email de recuperação de senha para ${to}`);

    return sendMailWithMailerSend({
      to_email: to,
      to_name: name || 'Usuário',
      subject: 'Redefinição de Senha - AI Crypto Trading',
      html,
      text,
      emailType: 'PASSWORD_RESET',
      userId
    });
  },

  /**
   * Atualizar status de um email (para uso em webhooks)
   */
  updateEmailStatus,

  /**
   * Obter histórico de emails para um usuário
   */
  async getUserEmailLogs(userId: string) {
    return prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Obter todos os logs de email (para admin)
   */
  async getAllEmailLogs(options: {
    page?: number;
    limit?: number;
    status?: string;
    emailType?: string;
    email?: string;
  }) {
    const { page = 1, limit = 50, status, emailType, email } = options;
    const skip = (page - 1) * limit;

    // Corrigir tipos para enums do Prisma
    const where: {
      status?: EmailStatus;
      emailType?: EmailType;
      toEmail?: { contains: string };
    } = {};

    if (status && Object.values(EmailStatus).includes(status as EmailStatus)) {
      where.status = status as EmailStatus;
    }

    if (emailType && Object.values(EmailType).includes(emailType as EmailType)) {
      where.emailType = emailType as EmailType;
    }

    if (email) {
      where.toEmail = { contains: email };
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.emailLog.count({ where })
    ]);

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  }
};

/**
 * Template de email de verificação
 */
const createVerificationEmailTemplate = ({ name, verificationUrl }: Omit<EmailVerificationParams, 'to'>) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verificação de Email - AI Crypto Trading</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container { padding: 20px; }
          .header {
            background-color: #1E40AF;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content { padding: 20px; }
          .button {
            display: inline-block;
            background-color: #1E40AF;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            font-size: 12px;
            color: #666;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI Crypto Trading</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Obrigado por se cadastrar na plataforma AI Crypto Trading.</p>
            <p>Para ativar sua conta e ter acesso a todas as funcionalidades, clique no botão abaixo para verificar seu endereço de email:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar Email</a>
            </p>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p>${verificationUrl}</p>
            <p>Se você não solicitou esta verificação, por favor, ignore este email.</p>
            <p>Atenciosamente,<br>Equipe AI Crypto Trading</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} AI Crypto Trading. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Template de texto plano para email de verificação (para clientes que não suportam HTML)
 */
const createVerificationEmailTextTemplate = ({ name, verificationUrl }: Omit<EmailVerificationParams, 'to'>) => {
  return `
Olá, ${name}!

Obrigado por se cadastrar na plataforma AI Crypto Trading.

Para ativar sua conta e ter acesso a todas as funcionalidades, copie e cole o link abaixo no seu navegador:

${verificationUrl}

Se você não solicitou esta verificação, por favor, ignore este email.

Atenciosamente,
Equipe AI Crypto Trading

© ${new Date().getFullYear()} AI Crypto Trading. Todos os direitos reservados.
  `;
};

/**
 * Template de email de redefinição de senha
 */
const createPasswordResetEmailTemplate = ({ name, resetUrl }: Omit<PasswordResetParams, 'to'>) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Redefinição de Senha - AI Crypto Trading</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container { padding: 20px; }
          .header {
            background-color: #1E40AF;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content { padding: 20px; }
          .button {
            display: inline-block;
            background-color: #1E40AF;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .warning {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            font-size: 12px;
            color: #666;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI Crypto Trading</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </p>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p>${resetUrl}</p>
            <div class="warning">
              <p><strong>Atenção:</strong> Este link é válido por apenas 1 hora e pode ser usado apenas uma vez.</p>
              <p>Se você não solicitou a redefinição de senha, por favor, ignore este email ou entre em contato conosco imediatamente.</p>
            </div>
            <p>Atenciosamente,<br>Equipe AI Crypto Trading</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} AI Crypto Trading. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Template de texto plano para email de redefinição de senha (para clientes que não suportam HTML)
 */
const createPasswordResetEmailTextTemplate = ({ name, resetUrl }: Omit<PasswordResetParams, 'to'>) => {
  return `
Olá, ${name}!

Recebemos uma solicitação para redefinir a senha da sua conta.

Para criar uma nova senha, copie e cole o link abaixo no seu navegador:

${resetUrl}

ATENÇÃO: Este link é válido por apenas 1 hora e pode ser usado apenas uma vez.

Se você não solicitou a redefinição de senha, por favor, ignore este email ou entre em contato conosco imediatamente.

Atenciosamente,
Equipe AI Crypto Trading

© ${new Date().getFullYear()} AI Crypto Trading. Todos os direitos reservados.
  `;
};
