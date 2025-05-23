export interface AuthErrorDetails {
  code: string;
  title: string;
  message: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export const AUTH_ERRORS: Record<string, AuthErrorDetails> = {
  // Erros de credenciais
  CredentialsSignin: {
    code: 'CREDENTIALS_SIGNIN',
    title: 'Credenciais Inválidas',
    message: 'Email ou senha incorretos.',
    suggestion: 'Verifique se digitou corretamente seu email e senha. Lembre-se que a senha diferencia maiúsculas de minúsculas.',
    severity: 'error'
  },
  
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    title: 'Usuário Não Encontrado',
    message: 'Não encontramos uma conta com este email.',
    suggestion: 'Verifique se o email está correto ou registre-se para criar uma nova conta.',
    severity: 'warning'
  },
  
  INVALID_PASSWORD: {
    code: 'INVALID_PASSWORD',
    title: 'Senha Incorreta',
    message: 'A senha informada está incorreta.',
    suggestion: 'Tente novamente ou use a opção "Esqueci minha senha" para redefini-la.',
    severity: 'error'
  },
  
  // Erros de verificação
  email_not_verified: {
    code: 'EMAIL_NOT_VERIFIED',
    title: 'Email Não Verificado',
    message: 'Sua conta precisa ser verificada antes do primeiro login.',
    suggestion: 'Verifique sua caixa de entrada (incluindo spam) e clique no link de verificação. Se não recebeu, podemos reenviar.',
    severity: 'warning'
  },
  
  ACCOUNT_SUSPENDED: {
    code: 'ACCOUNT_SUSPENDED',
    title: 'Conta Suspensa',
    message: 'Sua conta foi temporariamente suspensa.',
    suggestion: 'Entre em contato com o suporte para mais informações sobre a suspensão.',
    severity: 'error'
  },
  
  // Erros de sistema
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    title: 'Erro Temporário do Sistema',
    message: 'Estamos enfrentando problemas técnicos momentâneos.',
    suggestion: 'Tente novamente em alguns segundos. Se o problema persistir, entre em contato conosco.',
    severity: 'error'
  },
  
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    title: 'Muitas Tentativas',
    message: 'Você fez muitas tentativas de login recentemente.',
    suggestion: 'Aguarde alguns minutos antes de tentar novamente por segurança.',
    severity: 'warning'
  },
  
  // Erros de configuração (apenas em dev)
  MISSING_CONFIG: {
    code: 'MISSING_CONFIG',
    title: 'Configuração Ausente',
    message: 'Configuração de autenticação incompleta.',
    suggestion: 'Verifique as variáveis de ambiente (NEXTAUTH_SECRET, DATABASE_URL).',
    severity: 'error'
  },

  // Erro genérico
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    title: 'Erro Inesperado',
    message: 'Ocorreu um erro que não conseguimos identificar.',
    suggestion: 'Tente novamente ou entre em contato com o suporte se o problema persistir.',
    severity: 'error'
  }
};

export function getAuthErrorDetails(errorCode: string): AuthErrorDetails {
  return AUTH_ERRORS[errorCode] || AUTH_ERRORS.UNKNOWN_ERROR;
}

// Sistema de auditoria para desenvolvimento
export interface AuthAuditLog {
  timestamp: Date;
  action: string;
  email?: string;
  errorCode?: string;
  userAgent: string;
  ip?: string;
  success: boolean;
}

export class AuthAuditor {
  private static logs: AuthAuditLog[] = [];
  
  static log(event: Omit<AuthAuditLog, 'timestamp' | 'userAgent'>) {
    this.logs.push({
      ...event,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'
    });
    
    // Manter apenas os últimos 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
    
    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Auth Audit Log');
      console.log('Action:', event.action);
      console.log('Success:', event.success ? '✅' : '❌');
      console.log('Email:', event.email || 'N/A');
      console.log('Error:', event.errorCode || 'N/A');
      console.log('Time:', new Date().toLocaleTimeString());
      console.groupEnd();
    }
  }
  
  static getLogs(): AuthAuditLog[] {
    return [...this.logs];
  }
  
  static clearLogs(): void {
    this.logs = [];
  }
}

// Função para validar status do sistema
export interface SystemStatus {
  database: boolean;
  auth: boolean;
  api: boolean;
}

export async function checkSystemStatus(): Promise<SystemStatus> {
  const status: SystemStatus = {
    database: false,
    auth: false,
    api: false
  };

  try {
    // Check API
    const response = await fetch('/api/auth/csrf', { method: 'GET' });
    status.api = response.ok;
    status.auth = response.ok;
    
    // Em uma implementação real, você poderia ter endpoints específicos
    // para verificar o status do database
    status.database = response.ok;
  } catch (error) {
    console.error('Erro ao verificar status do sistema:', error);
  }

  return status;
} 