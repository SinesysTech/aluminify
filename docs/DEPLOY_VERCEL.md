# 🚀 Deploy na Vercel - Guia Completo

## ✅ **Configuração Atualizada para Deploy**

### 📊 Configurações Aplicadas

- **Framework:** Next.js 16 (detectado automaticamente)
- **Região:** iad1 (US East)
- **Timeout de API:** 30 segundos
- **Headers de Segurança:** Configurados
- **Otimizações:** Bundle splitting e compressão habilitadas

### 📋 Arquivos de Configuração

- ✅ `vercel.json` - Configurações do projeto
- ✅ `next.config.ts` - Otimizações do Next.js
- ✅ `.vercelignore` - Arquivos excluídos do deploy
- ✅ `.gitignore` - Arquivos ignorados pelo Git

---

## 🎯 **Como Fazer Deploy na Vercel**

### Opção 1: Deploy Automático (Recomendado)

Se o projeto já está conectado à Vercel:

1. **Faça push das mudanças:**
   ```bash
   git add .
   git commit -m "build: atualiza build para deploy"
   git push origin main
   ```

2. **A Vercel fará o deploy automaticamente** quando detectar o push

### Opção 2: Deploy Manual via CLI

1. **Instalar Vercel CLI (se ainda não tiver):**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Fazer deploy:**
   ```bash
   vercel --prod
   ```

### Opção 3: Deploy via Dashboard da Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Clique em "Deploy" ou aguarde o deploy automático

---

## ⚙️ **Configurações Necessárias na Vercel**

### 1. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis de ambiente estão configuradas na Vercel:

#### Variáveis Obrigatórias:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua_chave_secreta
```

#### Variáveis Recomendadas:
```
UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis
N8N_WEBHOOK_URL=https://seu-webhook.n8n.io
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app
PUBLIC_API_URL=https://seu-dominio.vercel.app
```

**Como configurar:**
1. Acesse seu projeto na Vercel Dashboard
2. Vá em **Settings → Environment Variables**
3. Adicione todas as variáveis necessárias
4. Configure para **Production**, **Preview** e **Development** conforme necessário

### 2. Configurações de Build

A Vercel detectará automaticamente:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node.js Version:** 20.x (recomendado)

### 3. Configurações de Segurança

O projeto já está configurado com:
- ✅ Headers de segurança (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- ✅ Timeout de 30 segundos para funções API
- ✅ Compressão habilitada
- ✅ Otimizações de bundle

---

## 🔍 **Verificações Pós-Deploy**

Após o deploy, verifique:

1. ✅ **Build bem-sucedido** - Verifique os logs na Vercel
2. ✅ **Rotas acessíveis** - Teste as principais rotas da aplicação
3. ✅ **Variáveis de ambiente** - Confirme que todas estão configuradas
4. ✅ **Conexão com Supabase** - Teste autenticação e queries
5. ✅ **Redis funcionando** - Se configurado, teste cache e sessões
6. ✅ **Headers de segurança** - Verifique no DevTools do navegador
7. ✅ **Performance** - Verifique métricas no dashboard da Vercel

---

## 🆘 **Troubleshooting**

### Problemas Comuns e Soluções

#### 1. Build Falha

**Sintomas:** Erro durante o build na Vercel

**Soluções:**
```bash
# Teste localmente primeiro
npm install
npm run build

# Limpe o cache
rm -rf .next node_modules
npm install
npm run build
```

**Verifique:**
- Logs detalhados na Vercel Dashboard
- Versão do Node.js (deve ser 20.x)
- Dependências no `package.json`

#### 2. Variáveis de Ambiente Não Funcionam

**Sintomas:** Erros relacionados a variáveis não definidas

**Soluções:**
1. Verifique se todas as variáveis estão configuradas na Vercel
2. Confirme que estão marcadas para o ambiente correto (Production/Preview)
3. Faça um redeploy após adicionar novas variáveis
4. Verifique se os nomes das variáveis estão corretos (case-sensitive)

#### 3. Timeout em Funções API

**Sintomas:** Erro 504 ou timeout em rotas API

**Soluções:**
- O timeout padrão é 30 segundos (configurado no `vercel.json`)
- Para funções que precisam de mais tempo, ajuste no `vercel.json`:
```json
{
  "functions": {
    "app/api/rota-especifica/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

#### 4. Erros de TypeScript

**Sintomas:** Build falha por erros de TypeScript

**Soluções:**
```bash
# Verifique erros localmente
npm run build

# Corrija os erros antes de fazer push
```

#### 5. Problemas com Imagens

**Sintomas:** Imagens não carregam ou erro de domínio

**Soluções:**
- Verifique se o domínio do Supabase está em `remotePatterns` no `next.config.ts`
- Adicione novos domínios se necessário

---

## 📊 **Otimizações Aplicadas**

### Configurações do Next.js
- ✅ React Strict Mode habilitado
- ✅ Compressão ativada
- ✅ Otimização de imagens (AVIF e WebP)
- ✅ Bundle splitting otimizado
- ✅ Tree-shaking de pacotes grandes

### Configurações da Vercel
- ✅ Headers de segurança configurados
- ✅ Timeout de funções configurado
- ✅ Região otimizada (iad1)
- ✅ Arquivos desnecessários excluídos (`.vercelignore`)

---

## ✅ **Checklist Pré-Deploy**

Antes de fazer o deploy, certifique-se de:

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Build local funciona sem erros (`npm run build`)
- [ ] TypeScript compila sem erros
- [ ] Testes locais passam (se houver)
- [ ] `.env.local` não está commitado (verifique `.gitignore`)
- [ ] Documentação está atualizada
- [ ] Código está commitado e pushado para o repositório

---

## 🚀 **Status Atual**

- ✅ **Configuração:** Completa e otimizada
- ✅ **Pronto para deploy:** Sim
- ✅ **Documentação:** Atualizada
- ✅ **Segurança:** Headers configurados
- ✅ **Performance:** Otimizações aplicadas

**O projeto está pronto para deploy na Vercel!** 🎉

---

**Última atualização:** Configurações atualizadas para deploy otimizado na Vercel



