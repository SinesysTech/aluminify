# Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o projeto.

## 📋 Variáveis Obrigatórias

### Supabase - Cliente (Públicas)

Essas variáveis são expostas ao cliente (browser) e devem começar com `NEXT_PUBLIC_`:

```env
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública/anônima do Supabase (para uso no cliente)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon
```

### Supabase - Servidor (Privadas)

Essas variáveis são usadas apenas no servidor e NUNCA devem ser expostas ao cliente:

```env
# URL do Supabase (para uso no servidor)
SUPABASE_URL=https://seu-projeto.supabase.co

# Chave secreta do Supabase (para operações administrativas)
# IMPORTANTE: Nunca exponha esta chave no cliente!
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta
```

## 🔧 Variáveis Opcionais (mas Recomendadas)

### Upstash Redis

O Redis é usado para cache e armazenamento temporário de respostas do chat. É **altamente recomendado** para produção, especialmente em ambientes serverless como Vercel.

```env
# URL do Redis Upstash
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io

# Token de autenticação do Redis Upstash
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
```

**Nota:** Se essas variáveis não estiverem configuradas, o sistema usará um fallback em memória, que **NÃO funciona** em ambientes serverless (Vercel, AWS Lambda) porque cada requisição pode rodar em uma instância diferente.

## 🔐 Onde Obter as Variáveis

### Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings > API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - **service_role key** (ou secret key) → `SUPABASE_SECRET_KEY`

### Upstash Redis

1. Acesse [Upstash Console](https://console.upstash.com)
2. Crie uma nova instância Redis (se ainda não tiver)
3. Copie:
   - **REST URL** → `UPSTASH_REDIS_REST_URL`
   - **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

## 📝 Configuração Local

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
```

**⚠️ IMPORTANTE:** O arquivo `.env.local` está no `.gitignore` e NUNCA deve ser commitado no repositório.

## 🚀 Configuração na Vercel

Na Vercel, configure as variáveis de ambiente em:

**Settings > Environment Variables**

Adicione todas as variáveis listadas acima. Você pode configurar diferentes valores para:
- **Production** (produção)
- **Preview** (branches e PRs)
- **Development** (local)

## 🔒 Segurança

- ✅ Variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente
- ❌ Variáveis sem `NEXT_PUBLIC_` são apenas do servidor
- ⚠️ **NUNCA** commite arquivos `.env` ou `.env.local`
- ⚠️ **NUNCA** exponha `SUPABASE_SECRET_KEY` no cliente
- ⚠️ Use variáveis de ambiente na Vercel para valores sensíveis

## 📚 Referências

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)

---

**Última atualização:** Janeiro 2025















