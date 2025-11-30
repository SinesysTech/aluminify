# Guia de Deploy na Vercel

Este documento descreve como fazer o deploy do projeto Área do Aluno na Vercel.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Projeto no [Supabase](https://supabase.com) configurado
- Instância do [Upstash Redis](https://upstash.com) (opcional, mas recomendado para produção)
- Repositório Git (GitHub, GitLab ou Bitbucket)

## 🚀 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que todos os arquivos estão commitados e enviados para o repositório:

```bash
git add .
git commit -m "Preparar para deploy na Vercel"
git push
```

### 2. Conectar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe seu repositório Git
4. A Vercel detectará automaticamente que é um projeto Next.js

### 3. Configurar Variáveis de Ambiente

Na página de configuração do projeto na Vercel, adicione as seguintes variáveis de ambiente:

#### Variáveis Obrigatórias

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta
```

#### Variáveis Opcionais (mas recomendadas para produção)

```
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
```

**⚠️ IMPORTANTE:**
- As variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente
- `SUPABASE_SECRET_KEY` é sensível e NUNCA deve ser exposta no cliente
- Configure todas as variáveis antes de fazer o deploy

### 4. Configurações de Build

A Vercel detectará automaticamente:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Se necessário, você pode ajustar essas configurações nas **Settings > General**.

### 5. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Após o sucesso, você receberá uma URL de produção

### 6. Verificar Deploy

Após o deploy, verifique:

1. ✅ A aplicação carrega corretamente
2. ✅ A autenticação funciona
3. ✅ As rotas de API respondem corretamente
4. ✅ O Redis está funcionando (se configurado)

## 🔧 Configurações Adicionais

### Domínio Customizado

1. Vá em **Settings > Domains**
2. Adicione seu domínio customizado
3. Siga as instruções de DNS

### Variáveis de Ambiente por Ambiente

Você pode configurar variáveis diferentes para:
- **Production** (produção)
- **Preview** (branches e PRs)
- **Development** (local)

Acesse **Settings > Environment Variables** para configurar.

### Configurações de Região

O arquivo `vercel.json` já está configurado para usar a região `iad1` (US East). Você pode alterar isso se necessário.

## 📝 Arquivos de Configuração

### vercel.json

O arquivo `vercel.json` contém as configurações básicas do projeto:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### middleware.ts

O arquivo `middleware.ts` na raiz gerencia a autenticação em todas as rotas usando Supabase SSR.

## 🐛 Troubleshooting

### Erro: "Environment variables not found"

- Verifique se todas as variáveis de ambiente foram configuradas na Vercel
- Certifique-se de que os nomes das variáveis estão corretos (case-sensitive)

### Erro: "Build failed"

- Verifique os logs de build na Vercel
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript ou lint

### Problemas com Autenticação

- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` estão corretos
- Certifique-se de que as URLs de redirect estão configuradas no Supabase

### Problemas com Redis

- Se o Redis não estiver configurado, o sistema usará fallback em memória (não recomendado para produção)
- Verifique se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estão corretos

## 📚 Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Upstash Redis](https://docs.upstash.com/redis)

## 🔐 Segurança

- ⚠️ Nunca commite arquivos `.env` ou `.env.local`
- ⚠️ Use variáveis de ambiente na Vercel para valores sensíveis
- ⚠️ Configure CORS adequadamente no Supabase
- ⚠️ Use HTTPS em produção (Vercel fornece automaticamente)

## ✅ Checklist de Deploy

Antes de fazer o deploy, certifique-se de:

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] O projeto builda localmente sem erros (`npm run build`)
- [ ] Os testes passam (se houver)
- [ ] As URLs de redirect estão configuradas no Supabase
- [ ] O Redis está configurado (recomendado)
- [ ] O domínio customizado está configurado (se aplicável)

---

**Última atualização:** Janeiro 2025















