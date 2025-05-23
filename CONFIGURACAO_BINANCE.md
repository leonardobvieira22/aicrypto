# 🔧 Configuração das Credenciais da Binance

## ⚠️ Problema Identificado

O gráfico não está aparecendo porque as **variáveis de ambiente da Binance não estão configuradas** no arquivo `.env`.

## ✅ Solução

### 1. Verificar o arquivo `.env`

O arquivo `.env` deve conter as seguintes variáveis:

```env
# Configuração da API Binance (Credenciais "Mãe" para dados de gráfico)
NEXT_PUBLIC_BINANCE_API_KEY="sua-api-key-da-binance-aqui"
BINANCE_API_SECRET="seu-api-secret-da-binance-aqui"
```

### 2. Como obter as credenciais da Binance

1. **Acesse sua conta na Binance**
2. **Vá para API Management** (Gerenciamento de API)
3. **Crie uma nova API Key** com as seguintes permissões:
   - ✅ **Spot & Margin Trading** (para dados de mercado)
   - ✅ **Futures Trading** (opcional)
   - ❌ **Withdrawals** (NÃO habilitar por segurança)

### 3. Configurar no arquivo `.env`

Substitua os valores no seu arquivo `.env`:

```env
# Outras configurações existentes...
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# ADICIONE ESTAS LINHAS:
NEXT_PUBLIC_BINANCE_API_KEY="VGQ0dhdCcHjDhEjj0Xuue3ZtyIZHiG9NK8chA4ew0HMQMywydjrVrLTWeN8nnZ9e"
BINANCE_API_SECRET="jHrPFutd2fQH2AECeABbG6mDvbJqhEYBt1kuYmiWfcBjJV22Fwtykqx8mDFle3dO"
```

### 4. Reiniciar a aplicação

Após configurar as variáveis:

```bash
# Parar o servidor (Ctrl+C)
# Depois executar:
npm run dev
```

## 🔍 Verificação

Para verificar se as credenciais estão funcionando:

1. **Abra o console do navegador** (F12)
2. **Procure por logs** como:
   - ✅ `"Conexão com API mãe da Binance estabelecida - dados reais disponíveis"`
   - ❌ `"Erro ao conectar com API mãe da Binance"`

## 🚨 Importante

- **NUNCA** compartilhe suas credenciais da Binance
- **Use credenciais de teste** ou com permissões limitadas
- **As credenciais fornecidas acima são de exemplo** - substitua pelas suas próprias

## 📊 Status Atual

- ✅ **API da Binance**: Funcionando (testado)
- ✅ **Dados de mercado**: Disponíveis
- ❌ **Variáveis de ambiente**: Não configuradas
- ❌ **Gráfico**: Não carrega por falta de credenciais

## 🔧 Correção Aplicada

Modifiquei o código para tentar carregar os dados mesmo se a verificação inicial falhar, mas **é recomendado configurar as variáveis de ambiente corretamente** para o funcionamento completo do sistema. 