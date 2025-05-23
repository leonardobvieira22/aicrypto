/**
 * Sistema de email profissional
 * Nodemailer com múltiplos provedores
 */

// Configurações de ambiente
const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN
const MAILERSEND_DOMAIN = process.env.MAILERSEND_DOMAIN || 'test-dnvo4d9mxy6g5r86.mlsender.net'
const FROM_EMAIL = `noreply@${MAILERSEND_DOMAIN}`
const FROM_NAME = 'AI Crypto Trading'

// Interface para dados de email
interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

// Interface para resultado de envio
interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider: 'smtp' | 'ethereal' | 'none'
}

// Função para enviar email via SMTP (MailerSend)
async function sendWithSMTP(emailData: EmailData): Promise<EmailResult> {
  try {
    console.log(`📧 [EMAIL] Tentando SMTP para: ${emailData.to}`)
    
    const nodemailer = await import('nodemailer')
    
    if (!MAILERSEND_API_TOKEN) {
      throw new Error('MAILERSEND_API_TOKEN não configurado')
    }
    
    // Configurar transporter para MailerSend via SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailersend.net',
      port: 587,
      secure: false,
      auth: {
        user: 'MS_SMTP_USER', // Usuário SMTP do MailerSend
        pass: MAILERSEND_API_TOKEN,
      },
    })
    
    // Enviar email
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      html: emailData.html,
    })
    
    console.log('✅ [EMAIL] Email enviado via SMTP:', info.messageId)
    
    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp'
    }
  } catch (error) {
    console.error('❌ [EMAIL] Erro no SMTP:', error)
    throw error
  }
}

// Função para enviar email via Ethereal (fallback)
async function sendWithEthereal(emailData: EmailData): Promise<EmailResult> {
  try {
    console.log(`📧 [EMAIL] Enviando via Ethereal para: ${emailData.to}`)
    
    const nodemailer = await import('nodemailer')
    
    // Criar conta de teste Ethereal
    const testAccount = await nodemailer.createTestAccount()
    
    // Configurar transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    
    // Enviar email
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${testAccount.user}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      html: emailData.html,
    })
    
    console.log('✅ [EMAIL] Email enviado via Ethereal:', info.messageId)
    console.log('🔗 [EMAIL] Preview URL:', nodemailer.getTestMessageUrl(info))
    
    return {
      success: true,
      messageId: info.messageId,
      provider: 'ethereal'
    }
  } catch (error) {
    console.error('❌ [EMAIL] Erro no Ethereal:', error)
    throw error
  }
}

// Função principal para enviar email
export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  const startTime = Date.now()
  
  try {
    // Tentar SMTP primeiro se configurado
    if (MAILERSEND_API_TOKEN) {
      try {
        const result = await sendWithSMTP(emailData)
        const duration = Date.now() - startTime
        console.log(`⚡ [EMAIL] Enviado via SMTP em ${duration}ms`)
        return result
      } catch (error) {
        console.warn('⚠️ [EMAIL] SMTP falhou, tentando Ethereal...')
      }
    }
    
    // Fallback para Ethereal
    const result = await sendWithEthereal(emailData)
    const duration = Date.now() - startTime
    console.log(`⚡ [EMAIL] Enviado via Ethereal em ${duration}ms`)
    return result
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ [EMAIL] Falha total após ${duration}ms:`, error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      provider: 'none'
    }
  }
}

// Templates de email
export const emailTemplates = {
  // Template de verificação de email
  emailVerification: (name: string, verificationUrl: string) => ({
    subject: 'Verifique seu email - AI Crypto Trading',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificação de Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 AI Crypto Trading</h1>
            <p>Bem-vindo à plataforma de trading inteligente</p>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Obrigado por se cadastrar na nossa plataforma. Para completar seu registro, precisamos verificar seu email.</p>
            <p>Clique no botão abaixo para verificar seu email:</p>
            <a href="${verificationUrl}" class="button">Verificar Email</a>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>Este link expira em 24 horas.</strong></p>
            <p>Se você não se cadastrou em nossa plataforma, pode ignorar este email.</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Crypto Trading. Todos os direitos reservados.</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AI Crypto Trading - Verificação de Email
      
      Olá, ${name}!
      
      Obrigado por se cadastrar na nossa plataforma. Para completar seu registro, precisamos verificar seu email.
      
      Acesse este link para verificar: ${verificationUrl}
      
      Este link expira em 24 horas.
      
      Se você não se cadastrou em nossa plataforma, pode ignorar este email.
      
      © 2024 AI Crypto Trading
    `
  }),

  // Template de recuperação de senha
  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Redefinir senha - AI Crypto Trading',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 AI Crypto Trading</h1>
            <p>Redefinição de senha</p>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Se você não solicitou esta redefinição, ignore este email e sua senha permanecerá inalterada.
            </div>
            <p>Para redefinir sua senha, clique no botão abaixo:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #ff6b6b;">${resetUrl}</p>
            <p><strong>Este link expira em 1 hora por segurança.</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 AI Crypto Trading. Todos os direitos reservados.</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AI Crypto Trading - Redefinição de Senha
      
      Olá, ${name}!
      
      Recebemos uma solicitação para redefinir a senha da sua conta.
      
      IMPORTANTE: Se você não solicitou esta redefinição, ignore este email.
      
      Para redefinir sua senha, acesse: ${resetUrl}
      
      Este link expira em 1 hora por segurança.
      
      © 2024 AI Crypto Trading
    `
  }),

  // Template de boas-vindas
  welcome: (name: string) => ({
    subject: 'Bem-vindo à AI Crypto Trading! 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2ecc71; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo, ${name}!</h1>
            <p>Sua conta foi criada com sucesso</p>
          </div>
          <div class="content">
            <h2>Parabéns! Você agora faz parte da AI Crypto Trading</h2>
            <p>Estamos muito felizes em tê-lo conosco. Nossa plataforma oferece:</p>
            
            <div class="feature">
              <h3>🤖 Trading Automatizado</h3>
              <p>Algoritmos inteligentes que operam 24/7 para maximizar seus lucros.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Análise Avançada</h3>
              <p>Relatórios detalhados e insights em tempo real do mercado.</p>
            </div>
            
            <div class="feature">
              <h3>🛡️ Segurança Total</h3>
              <p>Seus dados e investimentos protegidos com tecnologia de ponta.</p>
            </div>
            
            <div class="feature">
              <h3>📱 Acesso Mobile</h3>
              <p>Monitore seus investimentos a qualquer hora, em qualquer lugar.</p>
            </div>
            
            <p>Para começar, faça login na plataforma e configure suas preferências de trading.</p>
            <p><strong>Dica:</strong> Comece com o modo paper trading para se familiarizar com a plataforma sem riscos.</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Crypto Trading. Todos os direitos reservados.</p>
            <p>Precisa de ajuda? Entre em contato conosco.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AI Crypto Trading - Bem-vindo!
      
      Parabéns, ${name}! Sua conta foi criada com sucesso.
      
      Nossa plataforma oferece:
      
      🤖 Trading Automatizado
      Algoritmos inteligentes que operam 24/7 para maximizar seus lucros.
      
      📊 Análise Avançada
      Relatórios detalhados e insights em tempo real do mercado.
      
      🛡️ Segurança Total
      Seus dados e investimentos protegidos com tecnologia de ponta.
      
      📱 Acesso Mobile
      Monitore seus investimentos a qualquer hora, em qualquer lugar.
      
      Para começar, faça login na plataforma e configure suas preferências de trading.
      
      Dica: Comece com o modo paper trading para se familiarizar com a plataforma sem riscos.
      
      © 2024 AI Crypto Trading
    `
  })
}

// Função para enviar email de verificação
export async function sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<EmailResult> {
  const template = emailTemplates.emailVerification(name, verificationUrl)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

// Função para enviar email de recuperação de senha
export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<EmailResult> {
  const template = emailTemplates.passwordReset(name, resetUrl)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

// Função para enviar email de boas-vindas
export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const template = emailTemplates.welcome(name)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
} 