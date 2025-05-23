# Configuração do Tailwind CSS

Este projeto utiliza Tailwind CSS com configurações específicas para evitar erros no VS Code.

## Arquivos de Configuração

### `.vscode/settings.json`
Configurações do VS Code que:
- Desabilitam validação CSS nativa
- Habilitam suporte ao Tailwind CSS
- Incluem dados customizados para CSS
- Ignoram regras CSS desconhecidas

### `.vscode/css_custom_data.json`
Define as diretivas customizadas do Tailwind:
- `@tailwind`
- `@apply`
- `@layer`
- `@screen`
- `@responsive`
- `@variants`

### `.vscode/extensions.json`
Lista de extensões recomendadas:
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Path Intellisense
- TypeScript
- Prettier

## Resolvendo Erros

### Erro: "Unknown at rule @tailwind"
Este erro é resolvido pelas configurações do VS Code que:
1. Desabilitam validação CSS (`"css.validate": false`)
2. Ignoram regras desconhecidas (`"css.lint.unknownAtRules": "ignore"`)
3. Fornecem dados customizados para as diretivas do Tailwind

### Erro: "Unknown at rule @apply"
Resolvido da mesma forma que o erro `@tailwind`.

## Extensões Necessárias

Certifique-se de ter instalado:
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)

## Configuração do PostCSS

O arquivo `postcss.config.mjs` inclui:
- `tailwindcss`: Processa as diretivas do Tailwind
- `autoprefixer`: Adiciona prefixos de navegador automaticamente

## Configuração do Tailwind

O arquivo `tailwind.config.ts` inclui:
- Configuração de tema personalizada
- Cores do sistema de design
- Animações customizadas
- Plugins necessários

## Troubleshooting

Se ainda houver erros:
1. Reinicie o VS Code
2. Recarregue a janela (Ctrl+Shift+P > "Developer: Reload Window")
3. Certifique-se de que a extensão Tailwind CSS IntelliSense está instalada
4. Verifique se os arquivos de configuração estão no lugar correto

## Comandos Úteis

```bash
# Desenvolvimento
bun run dev

# Build de produção
bun run build

# Lint e formatação
bun run lint
bun run format
``` 