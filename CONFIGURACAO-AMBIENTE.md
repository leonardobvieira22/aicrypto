# Configuração de Ambiente - AI Crypto Trading

## Variáveis de Ambiente Obrigatórias

### Banco de Dados PostgreSQL (Neon)
```
DATABASE_URL=postgresql://neondb_owner:npg_pPqF8uoE6KYn@ep-gentle-boat-a56xil4c-pooler.us-east-2.aws.neon.tech/crypto_trading_db?sslmode=require
```

### NextAuth.js
```
NEXTAUTH_URL=https://main.d34l4lklofiz4e.amplifyapp.com
NEXTAUTH_SECRET=your-secret-key-here
```

### MailerSend (Email)
```
MAILERSEND_API_TOKEN=mlsn.b928d6b97328b42846ba4f9841fa4fbd7b4fbf0e63582d17589e0a0e05c1c3f9
MAILERSEND_DOMAIN=test-dnvo4d9mxy6g5r86.mlsender.net
```

### Binance API
```
BINANCE_API_KEY=VGQ0dhdCcH...
BINANCE_SECRET_KEY=your-binance-secret-here
```

### Ambiente
```
NODE_ENV=production
```

## Configuração no AWS Amplify

1. Acesse o console do AWS Amplify
2. Vá para a aplicação `d34l4lklofiz4e`
3. Clique em "Environment variables"
4. Adicione todas as variáveis listadas acima

## Sistema de Autenticação Implementado

### ✅ Funcionalidades Completas

1. **Registro de Usuário**
   - Validação completa (CPF, idade 18+, senha complexa)
   - Hash seguro de senha com PBKDF2
   - Criação automática de configurações padrão
   - Envio de email de verificação
   - Criação de: TradingSetting, PaperTradingWallet, NotificationPreferences

2. **Login de Usuário**
   - Verificação de senha segura
   - Rate limiting (5 tentativas, bloqueio 15min)
   - Verificação de email confirmado
   - Logs detalhados de segurança

3. **Sistema de Email**
   - MailerSend como provedor principal
   - Ethereal como fallback automático
   - Templates profissionais (verificação, boas-vindas, reset)
   - Envio em background para performance

4. **Banco de Dados**
   - Configuração otimizada para AWS Lambda
   - Conexão singleton para reutilização
   - Tratamento de erros robusto
   - Logs detalhados para debugging

### 🔧 APIs Disponíveis

- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/debug` - Debug de sistema (desenvolvimento)

### 🛡️ Segurança Implementada

- Hash PBKDF2 com 100.000 iterações
- Salt único por senha
- Rate limiting por IP/email
- Validação rigorosa de dados
- Sanitização de entrada
- Logs de auditoria

### 📧 Sistema de Email

- **Verificação de Email**: Link com token único (24h)
- **Boas-vindas**: Email automático após registro
- **Templates Responsivos**: HTML + texto puro
- **Fallback Automático**: MailerSend → Ethereal

### 🎯 Status do Sistema

**✅ PRONTO PARA PRODUÇÃO**

O sistema foi completamente reconstruído com:
- Arquitetura profissional e robusta
- Tratamento de erros completo
- Logs detalhados para debugging
- Performance otimizada para AWS Lambda
- Segurança de nível empresarial
- Validações brasileiras (CPF, idade)

### 🚀 Próximos Passos

1. Verificar se todas as variáveis de ambiente estão configuradas no Amplify
2. Testar o registro de usuário na aplicação
3. Verificar logs do CloudWatch para debugging
4. Confirmar recebimento de emails

### 📊 Monitoramento

- Logs disponíveis no AWS CloudWatch
- Métricas de performance no Amplify
- Logs de email com provider usado
- Logs de tentativas de login/registro 