# 🚀 AI Crypto Trading Platform

[![Deploy Status](https://img.shields.io/badge/Deploy-Success-brightgreen)](https://main.d34l4lklofiz4e.amplifyapp.com)
[![Security](https://img.shields.io/badge/Security-Audited-green)](./SECURITY.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Plataforma profissional de trading automatizado de criptomoedas com IA, totalmente funcional e segura.**

## 🎯 **STATUS DO PROJETO: PRODUÇÃO ✅**

### **✅ Funcionalidades Implementadas:**
- 🔐 **Sistema de autenticação completo** (NextAuth.js)
- 📧 **Envio de emails funcionando** (MailerSend API)
- 💾 **Banco de dados operacional** (PostgreSQL + Prisma)
- 🛡️ **Segurança auditada** - Vulnerabilidades corrigidas
- 🚀 **Deploy automático** (AWS Amplify)
- 📊 **Logs estruturados** (Winston)
- 🤖 **Integração Binance** (preparada)

### **📋 Correções Críticas Aplicadas:**
- ✅ **Campos do schema Prisma** corrigidos
- ✅ **Sistema de email** migrado para API HTTP
- ✅ **Credenciais de segurança** removidas do código
- ✅ **Cache AWS Lambda** otimizado
- ✅ **Configurações padrão** funcionando

## 🔒 **SEGURANÇA**

**⚠️ VULNERABILIDADE CRÍTICA CORRIGIDA:**
- **Problema:** Credenciais MailerSend expostas publicamente
- **Status:** ✅ **RESOLVIDO** - Todas as credenciais removidas
- **Documentação:** Ver [SECURITY.md](./SECURITY.md)

### **Medidas de Segurança Ativas:**
- 🛡️ Todas as credenciais em variáveis de ambiente
- 🔐 Hash seguro de senhas (PBKDF2)
- 🔍 Validação rigorosa de entrada
- 🌐 HTTPS obrigatório
- 📝 Logs de segurança ativos

## 🚀 **Deploy Rápido**

```bash
# 1. Clonar repositório
git clone https://github.com/leonardobvieira22/aicrypto.git
cd aicrypto

# 2. Instalar dependências
npm install

# 3. Configurar ambiente (ver CONFIGURACAO-AMBIENTE.md)
cp .envbuildamply .env.local
# Editar .env.local com suas credenciais

# 4. Deploy automático via GitHub → AWS Amplify
git push origin main
```

## ⚙️ **Configuração de Ambiente**

```bash
# Variáveis de ambiente para produção (.env.local)
NEXTAUTH_SECRET="sua-chave-secreta-super-segura-aqui"
NEXTAUTH_URL="https://main.d34l4lklofiz4e.amplifyapp.com"
DATABASE_URL="postgresql://username:password@host:port/database"
MAILERSEND_API_TOKEN="seu-token-mailersend-aqui"
MAILERSEND_DOMAIN="seu-dominio-verificado.mlsender.net"
EMAIL_FROM="noreply@seu-dominio-verificado.mlsender.net"
ADMIN_EMAIL="seu-email@exemplo.com"
```

**⚠️ IMPORTANTE:** Nunca commite credenciais reais. Use apenas placeholders em documentação.

## 📚 **Documentação Completa**

### **Configuração:**
- [🔧 Configuração de Ambiente](./CONFIGURACAO-AMBIENTE.md)
- [🚀 Deploy AWS Amplify](./DEPLOY_AWS_AMPLIFY.md)
- [🔐 Correções NextAuth](./CORRECOES-NEXTAUTH.md)

### **Segurança:**
- [🛡️ Segurança do Sistema](./SECURITY.md)
- [🔍 Auditoria de Vulnerabilidades](./SECURITY.md#auditoria-de-segurança)

### **Desenvolvimento:**
- [📋 Scripts de Teste](./scripts/)
- [🗃️ Schema do Banco](./prisma/schema.prisma)

## 🛠️ **Tecnologias**

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Banco:** PostgreSQL (Neon)
- **Auth:** NextAuth.js
- **Email:** MailerSend API
- **Deploy:** AWS Amplify
- **Trading:** Binance API (preparado)

## 🧪 **Testado e Funcionando**

```bash
# Testar sistema completo
npm run test:system

# Testar registro de usuário
node scripts/test-register-fixed.js

# Testar sistema de email
node scripts/test-email-service.js
```

## 📊 **Logs e Monitoramento**

```bash
# Logs AWS Amplify em tempo real
aws logs tail /aws/amplify/d34l4lklofiz4e --follow

# Health check
curl https://main.d34l4lklofiz4e.amplifyapp.com/api/health
```

## 🤝 **Contribuindo**

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. **VERIFIQUE SEGURANÇA:** Nunca commite credenciais
4. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Push para a branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🚨 **Reportar Vulnerabilidades**

**NÃO** abra issues públicas para vulnerabilidades de segurança. 
Veja [SECURITY.md](./SECURITY.md) para procedimentos seguros.

---

**✅ Sistema profissional e robusto, pronto para produção!**

**🔒 Auditado para segurança | 🚀 Deploy automático | 📧 Emails funcionando**
