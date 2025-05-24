# 🔒 Configuração de Variáveis de Ambiente

## 📋 Variáveis Obrigatórias

Para que o sistema funcione corretamente, configure as seguintes variáveis de ambiente:

### 🗄️ Banco de Dados
```env
DATABASE_URL="postgresql://usuario:senha@host/database?sslmode=require"
```

### 🔐 Autenticação (NextAuth.js)
```env
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="sua-chave-secreta-muito-segura-aqui"
```

### 📧 Email (MailerSend)
```env
MAILERSEND_API_TOKEN="seu-token-mailersend-aqui"
MAILERSEND_DOMAIN="seu-dominio-verificado.mlsender.net"
EMAIL_FROM="noreply@seu-dominio-verificado.mlsender.net"
ADMIN_EMAIL="admin@seusite.com"
```

### 📈 Binance API
```env
NEXT_PUBLIC_BINANCE_API_KEY="sua-chave-publica-binance"
BINANCE_API_SECRET="sua-chave-secreta-binance"
```

### 🤖 Grok AI API (X.ai) - **CRÍTICO**
```env
GROK_API_KEY="xai-sua-chave-grok-aqui"
```

### 🌐 Ambiente
```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

## ⚠️ **AVISO DE SEGURANÇA CRÍTICO**

### 🚨 **NUNCA** faça o seguinte:
- ❌ **NÃO** exponha chaves de API diretamente no código
- ❌ **NÃO** commite arquivos `.env` para o Git
- ❌ **NÃO** use valores padrão em produção
- ❌ **NÃO** compartilhe credenciais em mensagens/emails

### ✅ **SEMPRE** faça o seguinte:
- ✅ **USE** variáveis de ambiente para credenciais
- ✅ **CONFIGURE** chaves no AWS Amplify separadamente
- ✅ **MANTENHA** o `.env` no `.gitignore`
- ✅ **GERE** chaves únicas para cada ambiente

## 🛡️ Configuração Segura

### 1. **Desenvolvimento Local**
```bash
# Crie o arquivo .env na raiz do projeto
cp ENV_EXAMPLE.md .env
# Edite com suas credenciais reais
```

### 2. **Produção (AWS Amplify)**
Configure as variáveis no painel do Amplify:
- App Settings → Environment variables
- Adicione cada variável individualmente
- **NUNCA** copie/cole o arquivo .env inteiro

### 3. **Validação de Segurança**
```bash
# Verifique se não há credenciais expostas
git log --grep="API" --grep="KEY" --grep="SECRET"
# Verifique arquivos sensíveis
git ls-files | grep -E "\.(env|key|pem|p12)$"
```

## 🔄 Rotação de Chaves

### Periodicidade Recomendada:
- **Grok API**: A cada 3 meses
- **Binance API**: A cada 6 meses  
- **MailerSend**: A cada 12 meses
- **NextAuth Secret**: A cada 12 meses

### Processo de Rotação:
1. Gere nova chave no serviço
2. Atualize na AWS Amplify
3. Teste em staging
4. Deploy para produção
5. Revogue chave antiga

## 📞 Em Caso de Exposição

### Ações Imediatas:
1. **REVOGUE** a chave exposta imediatamente
2. **GERE** uma nova chave
3. **ATUALIZE** nas variáveis de ambiente
4. **FAÇA** deploy urgente
5. **MONITORE** logs de acesso

### Contatos de Emergência:
- **Grok AI**: https://x.ai/support
- **Binance**: https://binance.com/support
- **MailerSend**: https://mailersend.com/support

---

**⚠️ Esta configuração é CRÍTICA para a segurança do sistema. Trate com máxima prioridade.** 