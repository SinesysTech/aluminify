# 🚀 Guia de Configuração do Ambiente - Área do Aluno

Este guia irá ajudá-lo a configurar todo o ambiente necessário para trabalhar no projeto.

## 📋 Pré-requisitos

### 1. Node.js (Obrigatório)

**Versão necessária:** Node.js 18 ou superior

**Como instalar:**
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS (Long Term Support)
3. Execute o instalador e siga as instruções
4. Verifique a instalação:
   ```powershell
   node --version
   npm --version
   ```

### 2. Git (Opcional mas recomendado)

O Git já está instalado no seu sistema (encontrado em `C:\Program Files\Git\cmd\git.exe`).

### 3. Docker Desktop (Opcional - para Supabase local)

**Necessário apenas se quiser rodar Supabase localmente**

1. Baixe em: https://www.docker.com/products/docker-desktop/
2. Instale e certifique-se de que está rodando

### 4. Supabase CLI (Opcional - para gerenciar Supabase)

**Instalar após Node.js:**
```powershell
npm install -g supabase
```

**Verificar instalação:**
```powershell
supabase --version
```

## 🔧 Configuração do Projeto

### 1. Instalar Dependências

Após instalar o Node.js, execute:

```powershell
npm install
```

Isso instalará todas as dependências listadas no `package.json`.

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
# Obtenha essas variáveis em: https://app.supabase.com/project/wtqgfmtucqmpheghcvxo/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta

# Upstash Redis (Opcional mas recomendado)
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis

# N8N Webhook (Opcional - para chat com IA)
N8N_WEBHOOK_URL=https://webhook.sinesys.app/webhook/...

# URL base pública da API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** O arquivo `.env.local` está no `.gitignore` e NUNCA deve ser commitado.

Para mais detalhes, consulte: [docs/ENV_VARIABLES.md](./docs/ENV_VARIABLES.md)

### 3. Configurar MCP do Supabase (Opcional)

O MCP (Model Context Protocol) do Supabase permite que o Cursor acesse informações do banco de dados.

**Para configurar:**

1. Gere um Personal Access Token no Supabase:
   - Acesse: https://supabase.com/dashboard/account/tokens
   - Clique em "Generate new token"
   - Copie o token

2. Execute o script de configuração:
   ```powershell
   .\scripts\setup-supabase-mcp.ps1 -AccessToken "SEU_TOKEN_AQUI"
   ```

3. Feche e reabra o Cursor para aplicar as mudanças.

**Project Ref:** `wtqgfmtucqmpheghcvxo`

## 📦 Extensões do VS Code/Cursor Recomendadas

As seguintes extensões são recomendadas para melhor experiência de desenvolvimento:

1. **ESLint** (`dbaeumer.vscode-eslint`) - Linting de código
2. **Prettier** (`esbenp.prettier-vscode`) - Formatação de código
3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Autocomplete para Tailwind
4. **TypeScript** (`ms-vscode.vscode-typescript-next`) - Suporte TypeScript
5. **Error Lens** (`usernamehw.errorlens`) - Mostra erros inline
6. **Auto Rename Tag** (`formulahendry.auto-rename-tag`) - Renomeia tags HTML/JSX automaticamente
7. **Path IntelliSense** (`christian-kohler.path-intellisense`) - Autocomplete de caminhos
8. **JSON** (`ms-vscode.vscode-json`) - Suporte JSON
9. **YAML** (`redhat.vscode-yaml`) - Suporte YAML
10. **Supabase** (`supabase.supabase-vscode`) - Ferramentas Supabase
11. **Deno** (`denoland.vscode-deno`) - Suporte Deno (para Edge Functions)

**Para instalar automaticamente:**
- Abra o Cursor/VS Code
- Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
- Digite "Extensions: Show Recommended Extensions"
- Clique em "Install All"

Ou instale manualmente através da aba Extensions.

## 🚀 Executar o Projeto

Após configurar tudo:

```powershell
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start

# Linting
npm run lint
```

O projeto estará disponível em: `http://localhost:3000`

## ✅ Verificação do Ambiente

Execute os seguintes comandos para verificar se tudo está configurado:

```powershell
# Verificar Node.js
node --version  # Deve mostrar v18 ou superior

# Verificar npm
npm --version

# Verificar dependências instaladas
Test-Path node_modules  # Deve retornar True

# Verificar arquivo .env.local
Test-Path .env.local  # Deve retornar True

# Verificar Supabase CLI (se instalado)
supabase --version
```

## 📚 Documentação Adicional

- [README.md](./README.md) - Visão geral do projeto
- [docs/ENV_VARIABLES.md](./docs/ENV_VARIABLES.md) - Variáveis de ambiente detalhadas
- [docs/GUIA_INSTALACAO_SUPABASE_CLI.md](./docs/GUIA_INSTALACAO_SUPABASE_CLI.md) - Guia do Supabase CLI
- [docs/README.md](./docs/README.md) - Índice completo de documentação

## 🆘 Solução de Problemas

### Node.js não encontrado
- Certifique-se de que o Node.js está instalado
- Reinicie o terminal após instalar
- Verifique se o Node.js está no PATH do sistema

### Erro ao instalar dependências
- Certifique-se de que está usando Node.js 18+
- Tente limpar o cache: `npm cache clean --force`
- Delete `node_modules` e `package-lock.json` e tente novamente

### Erro de variáveis de ambiente
- Certifique-se de que o arquivo `.env.local` existe na raiz do projeto
- Verifique se todas as variáveis obrigatórias estão configuradas
- Consulte [docs/ENV_VARIABLES.md](./docs/ENV_VARIABLES.md)

### Erro ao conectar ao Supabase
- Verifique se as credenciais estão corretas no `.env.local`
- Certifique-se de que o projeto Supabase está ativo
- Verifique se as chaves não expiraram

---

**Última atualização:** Janeiro 2025






