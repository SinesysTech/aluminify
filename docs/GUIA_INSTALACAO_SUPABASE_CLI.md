# Guia de Instalação do Supabase CLI - Windows

## 📋 Pré-requisitos

1. **Docker Desktop** - O Supabase CLI usa Docker para rodar os serviços localmente
   - Baixe em: https://www.docker.com/products/docker-desktop/
   - Instale e certifique-se de que está rodando antes de usar o CLI
   - ✅ Você já mencionou que vai instalar o Docker Desktop

2. **Node.js** - Já está instalado (v24.8.0) ✅

## 🚀 Instalação do Supabase CLI

### Opção 1: Via npm (Mais Simples - Recomendado)

Como você já tem Node.js instalado, a forma mais simples é instalar globalmente via npm:

```powershell
npm install -g supabase
```

**Verificar instalação**:
```powershell
supabase --version
```

**Atualizar no futuro**:
```powershell
npm update -g supabase
```

### Opção 2: Via Scoop (Alternativa para Windows)

1. **Instalar Scoop** (se ainda não tiver):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Adicionar o bucket do Supabase**:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   ```

3. **Instalar o Supabase CLI**:
   ```powershell
   scoop install supabase
   ```

4. **Verificar instalação**:
   ```powershell
   supabase --version
   ```

### Opção 3: Via npx (Sem instalação global)

Você pode usar sem instalar globalmente:

```powershell
# Usar diretamente com npx (sem instalar)
npx supabase --version

# Ou adicionar ao package.json como dev dependency
npm install supabase --save-dev
```

## 🔗 Conectar ao Projeto Remoto

Após instalar o CLI, você precisa conectar ao seu projeto Supabase:

### Opção 1: Login Interativo (Recomendado)

1. **Fazer login no Supabase** (abre o navegador):
   ```powershell
   supabase login
   ```
   Isso abrirá o navegador para autenticação.

2. **Listar seus projetos**:
   ```powershell
   supabase projects list
   ```

3. **Conectar ao projeto**:
   ```powershell
   supabase link --project-ref wtqgfmtucqmpheghcvxo
   ```

### Opção 2: Login com Token (Para automação)

1. **Criar um Personal Access Token**:
   - Acesse: https://supabase.com/dashboard/account/tokens
   - Crie um novo token e copie

2. **Fazer login com o token**:
   ```powershell
   supabase login --token seu_token_aqui
   ```

3. **Conectar ao projeto**:
   ```powershell
   supabase link --project-ref wtqgfmtucqmpheghcvxo
   ```

## 📦 Deploy da Edge Function com --no-verify-jwt

Para fazer o deploy da Edge Function `gerar-cronograma` com `verify_jwt` desabilitado:

```powershell
supabase functions deploy gerar-cronograma --no-verify-jwt
```

**OU** você pode configurar no `supabase/config.toml`:

```toml
[functions.gerar-cronograma]
verify_jwt = false
```

E então fazer o deploy normalmente:

```powershell
supabase functions deploy gerar-cronograma
```

## 🔧 Comandos Úteis do Supabase CLI

### Desenvolvimento Local

```powershell
# Inicializar projeto Supabase local
supabase init

# Iniciar serviços locais (requer Docker)
supabase start

# Parar serviços locais
supabase stop

# Ver status dos serviços
supabase status
```

### Edge Functions

```powershell
# Servir função localmente (com hot reload)
supabase functions serve gerar-cronograma

# Servir função sem verificação JWT (para webhooks)
supabase functions serve gerar-cronograma --no-verify-jwt

# Deploy de função específica
supabase functions deploy gerar-cronograma

# Deploy de função sem verificação JWT
supabase functions deploy gerar-cronograma --no-verify-jwt

# Deploy de todas as funções
supabase functions deploy
```

### Migrações

```powershell
# Aplicar migrações ao projeto remoto
supabase db push

# Criar nova migração
supabase migration new nome_da_migracao

# Ver diferenças entre local e remoto
supabase db diff
```

### Secrets (Variáveis de Ambiente)

```powershell
# Listar secrets
supabase secrets list

# Definir um secret
supabase secrets set CHAVE=valor

# Definir múltiplos secrets de um arquivo .env
supabase secrets set --env-file supabase/functions/.env
```

## 📝 Próximos Passos Após Instalação

1. **Instalar Docker Desktop** (se ainda não tiver)
2. **Fazer login**: `supabase login`
3. **Conectar ao projeto**: `supabase link --project-ref wtqgfmtucqmpheghcvxo`
4. **Deploy da função com --no-verify-jwt**:
   ```powershell
   supabase functions deploy gerar-cronograma --no-verify-jwt
   ```

## 🔍 Verificação

Após instalar, verifique se tudo está funcionando:

```powershell
# Verificar versão
supabase --version

# Verificar se está conectado
supabase projects list

# Verificar status local (se tiver iniciado)
supabase status
```

## 📚 Documentação Oficial

- CLI Getting Started: https://supabase.com/docs/guides/local-development/cli/getting-started
- Edge Functions: https://supabase.com/docs/guides/functions
- Deploy Functions: https://supabase.com/docs/guides/functions/deploy

