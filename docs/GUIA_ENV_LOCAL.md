# 🔧 Guia Passo a Passo: Configurar .env.local

Este guia irá ajudá-lo a criar e configurar o arquivo `.env.local` com todas as variáveis necessárias.

## 📋 Passo 1: Criar o arquivo .env.local

O arquivo `.env.local` já foi criado como template. Agora você precisa preenchê-lo com suas credenciais.

## 🔐 Passo 2: Obter Credenciais do Supabase

### 2.1. Acessar o Dashboard do Supabase

1. Acesse: **https://app.supabase.com/project/wtqgfmtucqmpheghcvxo/settings/api**
   - Ou acesse: https://app.supabase.com
   - Selecione o projeto: `wtqgfmtucqmpheghcvxo`
   - Vá em **Settings → API**

### 2.2. Copiar as Credenciais

No painel de API, você encontrará:

#### ✅ Project URL
- **Onde encontrar:** Seção "Project URL"
- **Valor:** `https://wtqgfmtucqmpheghcvxo.supabase.co`
- **Use para:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_URL`

#### ✅ anon/public key
- **Onde encontrar:** Seção "Project API keys" → "anon" ou "public"
- **Valor:** Uma chave longa que começa com `eyJ...`
- **Use para:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

#### ✅ service_role key (Secret Key)
- **Onde encontrar:** Seção "Project API keys" → "service_role"
- **Valor:** Uma chave que começa com `sb_secret_...` ou `eyJ...`
- **⚠️ IMPORTANTE:** Esta chave tem acesso total ao banco. NUNCA exponha no cliente!
- **Use para:** `SUPABASE_SECRET_KEY`

### 2.3. Preencher no .env.local

Abra o arquivo `.env.local` e substitua:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=COLE_AQUI_A_CHAVE_ANON
SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
SUPABASE_SECRET_KEY=COLE_AQUI_A_CHAVE_SERVICE_ROLE
```

## 🔴 Passo 3: Configurar Upstash Redis (Opcional mas Recomendado)

### 3.1. Criar Conta/Instância no Upstash

1. Acesse: **https://console.upstash.com**
2. Faça login ou crie uma conta
3. Crie uma nova instância Redis (se ainda não tiver)
4. Escolha a região mais próxima

### 3.2. Obter Credenciais

Após criar a instância:

1. Clique na instância criada
2. Vá na aba **"REST API"**
3. Copie:
   - **REST URL** → `UPSTASH_REDIS_REST_URL`
   - **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

### 3.3. Preencher no .env.local

```env
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
```

**Nota:** Se não configurar o Redis, o sistema usará um fallback em memória que não funciona em ambientes serverless (Vercel). Para desenvolvimento local, pode funcionar, mas não é recomendado.

## 📝 Passo 4: Variáveis Opcionais

### N8N Webhook (Opcional)

Se você usar o chat com IA:

```env
N8N_WEBHOOK_URL=https://webhook.sinesys.app/webhook/...
```

### API URL (Opcional)

Para desenvolvimento local, deixe como está:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## ✅ Passo 5: Verificar o Arquivo

Seu arquivo `.env.local` final deve parecer com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
SUPABASE_SECRET_KEY=sb_secret_abc123...

# Redis (opcional)
UPSTASH_REDIS_REST_URL=https://abc123.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXAbc123...

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🔒 Segurança

- ✅ O arquivo `.env.local` está no `.gitignore` e NUNCA será commitado
- ✅ Variáveis com `NEXT_PUBLIC_` são expostas ao cliente (browser)
- ❌ Variáveis sem `NEXT_PUBLIC_` são apenas do servidor
- ⚠️ **NUNCA** compartilhe `SUPABASE_SECRET_KEY` publicamente
- ⚠️ **NUNCA** commite o arquivo `.env.local`

## 🚀 Próximos Passos

Após configurar o `.env.local`:

1. **Verificar se está correto:**
   ```powershell
   .\scripts\check-environment.ps1
   ```

2. **Iniciar o projeto:**
   ```powershell
   npm run dev
   ```

3. **Acessar:** http://localhost:3000

## 🆘 Problemas Comuns

### Erro: "Missing environment variables"
- Verifique se o arquivo está na raiz do projeto
- Verifique se o nome está correto: `.env.local` (não `.env.local.txt`)
- Verifique se não há espaços extras nos nomes das variáveis

### Erro: "Invalid API key"
- Verifique se copiou a chave completa (sem espaços)
- Verifique se está usando a chave correta (anon para público, service_role para servidor)

### Erro: "Cannot connect to Supabase"
- Verifique se a URL está correta
- Verifique se o projeto Supabase está ativo
- Verifique sua conexão com a internet

---

**Precisa de ajuda?** Consulte: `docs/ENV_VARIABLES.md`









