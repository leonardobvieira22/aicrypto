# Crypto AI Trading Platform

Plataforma de IA para negociação de criptomoedas, oferecendo estratégias de trading e alertas em tempo real.

## Visão Geral

AI Crypto Trading é uma plataforma completa para trading de criptomoedas que utiliza algoritmos de inteligência artificial para identificar oportunidades de mercado e executar operações de forma automatizada. A plataforma oferece uma experiência de usuário intuitiva, combinando o melhor do Mercado Pago (para landing page e onboarding) e da Binance (para o dashboard e painel de trading).

## Correções Implementadas

Este projeto recebeu as seguintes correções para resolver problemas de execução:

1. **Correção da biblioteca web-vitals**: Removida a dependência da função `onFID` que não é mais exportada.
2. **Correção da configuração do NextAuth**: Simplificada a configuração para evitar problemas com o adaptador Prisma.
3. **Atualização dos tipos TypeScript**: Atualizados os tipos para garantir compatibilidade.

Configure as variáveis de ambiente no console AWS Amplify:
DATABASE_URL
NEXTAUTH_SECRET
NEXT_PUBLIC_BINANCE_API_KEY
BINANCE_API_SECRET

## Execução do Projeto

### Pré-requisitos

- Node.js 18 ou superior
- npm, pnpm ou bun

### Instalação de Dependências

```bash
# Usando npm
npm install

# Usando pnpm
pnpm install

# Usando bun
bun install
```

### Iniciar o Servidor de Desenvolvimento

```bash
# Usando npm
npm run dev

# Usando pnpm
pnpm dev

# Usando bun
bun run dev
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000).

### Configuração da API da Binance

**📊 Dados do Gráfico:** 
O sistema já vem configurado com nossa API "mãe" para fornecer dados reais de mercado em tempo real. Os gráficos sempre mostram dados reais da Binance.

**🔧 API Pessoal do Usuário (Opcional):**
Para funcionalidades futuras como trading automático, você pode configurar suas próprias credenciais da Binance:

1. **Criar conta na Binance** (se não tiver):
   - Acesse [https://www.binance.com](https://www.binance.com)
   - Complete o processo de registro e verificação KYC

2. **Gerar chaves da API**:
   - Faça login na sua conta Binance
   - Acesse [Gerenciamento de API](https://www.binance.com/en/my/settings/api-management)
   - Clique em "Create API" e siga as instruções
   - **IMPORTANTE**: Configure as permissões para "Spot & Margin Trading"

3. **Configurar no Dashboard**:
   - Acesse o dashboard da aplicação
   - Na seção lateral direita, você verá o formulário "Configure sua API Pessoal da Binance"
   - Insira suas credenciais pessoais
   - Essas credenciais serão usadas para funcionalidades futuras

**⚠️ Importante sobre Segurança:**
- Os dados do gráfico sempre vêm da nossa API principal (segura)
- Suas credenciais pessoais ficam armazenadas apenas no seu navegador
- Nunca compartilhe suas chaves da API
- Use permissões mínimas necessárias na Binance

**Status da Conexão:**
- No dashboard, você verá indicadores de status:
  - 🟢 "Dados Reais" = API principal conectada (dados do gráfico)
  - 🔵 "API do usuário OK" = Suas credenciais configuradas e válidas
  - 🔘 "API não configurada" = Credenciais pessoais não configuradas (opcional)

### Construir para Produção

```bash
# Usando npm
npm run build
npm start

# Usando pnpm
pnpm build
pnpm start

# Usando bun
bun run build
bun run start
```

## Deploy no AWS Amplify

Este projeto está configurado para ser implantado facilmente no AWS Amplify. Para instruções detalhadas, consulte o arquivo [AMPLIFY_DEPLOYMENT.md](AMPLIFY_DEPLOYMENT.md).

### Preparar para Deploy

```bash
# Verificar e preparar para deploy
bun run prepare:amplify
```

## Solucionando Problemas Comuns

### Erro "Module not found: Can't resolve '@auth/prisma-adapter'"

Se você encontrar este erro, siga estas etapas:

1. Instale o adaptador Prisma:
   ```bash
   npm install @auth/prisma-adapter
   ```
2. Se o erro persistir, modifique o arquivo `src/app/api/auth/[...nextauth]/route.ts`:
   - Comente a linha que importa o PrismaAdapter
   - Comente a linha que configura o adaptador

### Erro "onFID is not exported from 'web-vitals'"

Este erro ocorre porque a função `onFID` não é mais exportada pelo pacote web-vitals. Para corrigir:

1. Edite o arquivo `src/lib/utils/webVitals.ts`
2. Remova a importação da função `onFID`
3. Remova qualquer chamada para `onFID()`

### Problema com o Prisma Client

Se ocorrer um erro relacionado ao Prisma Client:

```bash
# Gere o cliente Prisma
npx prisma generate

# Se necessário, atualize o esquema do banco de dados
npx prisma db push
```

### Limpar Cache e Reinstalar Dependências

Se encontrar problemas ao executar o projeto, tente os seguintes passos:

1. **Limpar o cache do Next.js**:
   ```bash
   rm -rf .next
   ```
2. **Reinstalar os módulos**:
   ```bash
   rm -rf node_modules
   npm install
   ```
   ou
   ```bash
   bun install
   ```
3. **Verificar dependências críticas**:
   ```bash
   npm install next-themes zustand date-fns framer-motion sonner lightweight-charts
   ```
   ou
   ```bash
   bun add next-themes zustand date-fns framer-motion sonner lightweight-charts
   ```

4. **Desativar o Turbopack**:
   Edite o arquivo `package.json` e remova a flag `--turbopack` do script `dev`.

5. Para instruções mais detalhadas, consulte o arquivo `.same/setup-instructions.md` ou `RUN_PROJECT.md` na raiz do projeto.

## Funcionalidades Principais

### Landing Page
- Design moderno e responsivo inspirado no Mercado Pago
- Seções informativas: hero, benefícios, estatísticas, depoimentos, parceiros, FAQ
- Formulários de inscrição e chamadas para ação estratégicas

### Autenticação e Onboarding
- Sistema de registro e login com validações
- Fluxo de onboarding em etapas: conexão com Binance, perfil de risco, seleção de robôs, resumo
- Autenticação segura com JWT e suporte para 2FA

### Dashboard Principal
- Visão geral do portfólio com métricas em tempo real
- Acompanhamento de desempenho dos robôs
- Histórico de operações e estatísticas

### Painel de Trading
- Gráficos avançados com Lightweight Charts
- Dados em tempo real via WebSockets
- Interface para execução de ordens (limite e mercado)
- Book de ordens e histórico de trades

### Robôs de IA
- Múltiplas estratégias de trading implementadas:
  - RSI Master: Utiliza o Índice de Força Relativa com IA
  - Bollinger IA: Identifica volatilidade e reversões com Bandas de Bollinger
  - MACD Pro: Análise avançada de convergência/divergência
  - Trend Hunter: Algoritmo de detecção de tendências
- Configuração personalizada para cada robô
- Perfis de risco: conservador, moderado e agressivo

### Backtesting e Paper Trading
- Ferramenta completa para testar estratégias em dados históricos
- Simulação de trading sem risco financeiro real
- Métricas detalhadas de desempenho
- Análise gráfica de resultados

### Sistema de Alertas
- Alertas de preço customizáveis
- Notificações em tempo real (aplicativo, email, push)
- Interface amigável para gerenciamento de alertas

### Integração com Binance
- Conexão segura com a API da Binance
- Suporte para dados de mercado em tempo real
- Execução de ordens diretamente na Binance

### Copy Trading
- Seguir estratégias de traders bem-sucedidos
- Histórico e métricas de desempenho
- Ranking de traders por performance

### Segurança
- Proteção de API keys com criptografia
- Autenticação de dois fatores
- Permissões granulares para robôs

## UI/UX Design System

Nossa plataforma implementa um sistema de design coeso e acessível, com atenção especial a:

### Sistema de Cores
- Paleta de cores unificada usando variáveis CSS em HSL
- Cores semânticas para estados (sucesso, erro, aviso, informação)
- Suporte a temas claro e escuro
- Alto contraste para acessibilidade

### Tipografia
- Escala tipográfica responsiva e consistente
- Família de fontes Inter otimizada para leitura
- Hierarquia clara de texto para melhor compreensão

### Componentes
- Biblioteca shadcn/ui para componentes consistentes
- Sistema de grid flexível e responsivo
- Componentes otimizados para acessibilidade (ARIA)
- Estados interativos bem definidos (hover, focus, active)

### Acessibilidade
- Conformidade com diretrizes WCAG 2.1 AA
- Suporte para navegação por teclado
- Descrições e labels em todos os elementos interativos
- Testado com ferramentas de acessibilidade (Lighthouse, axe)

## Stack Tecnológica

### Frontend
- Next.js 15 com React 18 e TypeScript
- Tailwind CSS para estilização
- Shadcn UI para componentes de interface
- Framer Motion para animações
- Lightweight Charts para gráficos de trading
- Zustand para gerenciamento de estado global
- WebSockets para dados em tempo real

### Algoritmos de IA
- Implementação de indicadores técnicos: RSI, MACD, Bollinger Bands, etc.
- Estratégias de trading baseadas em machine learning
- Sistema de combinação de sinais para decisões mais robustas

### Segurança
- Armazenamento seguro de credenciais
- Integração com APIs externas de forma segura
- Proteção contra ataques comuns

## Estrutura do Projeto

```
crypto-ai-trading-platform/
├── public/           # Arquivos estáticos
├── src/
│   ├── app/          # Páginas e roteamento Next.js
│   ├── components/   # Componentes React
│   │   ├── auth/     # Componentes de autenticação
│   │   ├── dashboard/# Componentes do dashboard
│   │   ├── landing/  # Componentes da landing page
│   │   ├── shared/   # Componentes compartilhados
│   │   └── ui/       # Componentes de UI base
│   ├── hooks/        # Hooks personalizados
│   ├── lib/          # Bibliotecas e utilitários
│   │   ├── context/  # Contextos React
│   │   ├── services/ # Serviços (Binance, Notificações, etc.)
│   │   └── utils/    # Funções utilitárias
```

## Roadmap de Desenvolvimento

### Fase 1: MVP (Concluído)
- [x] Landing page completa
- [x] Sistema de autenticação
- [x] Integração básica com Binance
- [x] Dashboard principal
- [x] Robots de trading simples

### Fase 2: Recursos Avançados (Concluído)
- [x] Painel de Trading avançado
- [x] WebSockets para dados em tempo real
- [x] Sistema de alertas e notificações
- [x] Backtesting e Paper Trading
- [x] Melhorias de UX e otimizações

### Fase 3: Expansão (Planejado)
- [ ] Implementação de backend com FastAPI
- [ ] Integração com banco de dados PostgreSQL
- [ ] Aprimoramento dos algoritmos de IA
- [ ] Processamento paralelo de sinais
- [ ] Deploy para produção com Docker

## Próximos Passos

1. Completar melhorias de responsividade para o painel de trading
2. Implementar testes de acessibilidade com ferramentas como Lighthouse e axe
3. Melhorar a experiência do tema escuro
4. Implementar um guia de componentes para manter consistência
5. Acompanhar métricas de desempenho da UI após as melhorias
6. Implementar página de Robôs (CRUD de robôs disponíveis para os usuários)
7. Criar página de Configurações (definir taxas, pares habilitados, planos, regras de cópia)
8. Adicionar autenticação/controle de acesso (NextAuth, roles e permissões)
9. Conectar formulários de Configurações à API para salvar no backend
10. Implementar backend (API Routes ou servidor) para persistência de dados

## Desenvolvimento UI/UX (Planos Específicos)

### Melhorias de Responsividade
- Implementar layouts adaptativos para o painel de trading em dispositivos móveis
- Utilizar consultas de mídia para ajustar a visualização de gráficos
- Implementar interações touch-friendly para dispositivos móveis

### Melhorias de Acessibilidade
- Adicionar recursos de alto contraste
- Garantir navegação completa por teclado
- Implementar roles e atributos ARIA apropriados
- Integrar testes automáticos de acessibilidade no processo de desenvolvimento

### Melhorias do Tema Escuro
- Refinar paleta de cores para o tema escuro
- Garantir contraste adequado em todos os elementos
- Implementar transições suaves entre temas

---

Sinta-se à vontade para entrar em contato para dúvidas ou sugestões de melhorias.

## Licença

MIT
