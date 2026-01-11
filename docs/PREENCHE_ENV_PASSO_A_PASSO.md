# 🎯 Guia Passo a Passo: Preencher .env.local

## 📍 **PASSO 1: Abrir o Dashboard do Supabase**

1. **Abra este link no seu navegador:**
   ```
   https://app.supabase.com/project/wtqgfmtucqmpheghcvxo/settings/api
   ```

2. **Ou siga este caminho:**
   - Acesse: https://app.supabase.com
   - Faça login (se necessário)
   - Selecione o projeto: `wtqgfmtucqmpheghcvxo`
   - No menu lateral, clique em **Settings** (⚙️)
   - Clique em **API**

---

## 🔍 **PASSO 2: Encontrar as Credenciais**

Na página de API, você verá várias seções. Procure por:

### ✅ **2.1. Project URL**

**Onde está:**
- No topo da página, seção "Project URL"
- Ou "Configuration" → "Project URL"

**O que copiar:**
- Deve ser algo como: `https://wtqgfmtucqmpheghcvxo.supabase.co`
- Copie a URL completa (incluindo `https://`)

**Onde colar no .env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co
```

---

### ✅ **2.2. anon/public key**

**Onde está:**
- Seção "Project API keys"
- Procure por uma chave chamada **"anon"** ou **"public"**
- Geralmente é a primeira chave listada

**O que copiar:**
- Uma chave muito longa que começa com `eyJ...`
- Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cWdm...`
- Clique no ícone de **copiar** (📋) ao lado da chave

**Onde colar no .env.local:**
```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE:** Copie a chave COMPLETA, sem espaços ou quebras de linha!

---

### ✅ **2.3. service_role key (Secret Key)**

**Onde está:**
- Na mesma seção "Project API keys"
- Procure por uma chave chamada **"service_role"**
- Pode estar oculta (mostra apenas alguns caracteres)
- Clique em **"Reveal"** ou **"Show"** para ver a chave completa

**O que copiar:**
- Uma chave que começa com `sb_secret_...` ou `eyJ...`
- Exemplo: `sb_secret_abc123def456...` ou `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Clique no ícone de **copiar** (📋) ao lado da chave

**Onde colar no .env.local:**
```env
SUPABASE_SECRET_KEY=sb_secret_abc123def456...
```

⚠️ **CRÍTICO:** Esta chave tem acesso TOTAL ao banco de dados. NUNCA compartilhe ou exponha publicamente!

---

## 📝 **PASSO 3: Editar o arquivo .env.local**

1. **Abra o arquivo `.env.local`** na raiz do projeto
   - Pode usar o Cursor, VS Code, ou qualquer editor de texto

2. **Substitua os valores de exemplo:**

   **ANTES:**
   ```env
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_chave_publica_ou_anon_aqui
   SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta_aqui
   ```

   **DEPOIS (com suas credenciais reais):**
   ```env
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cWdm...
   SUPABASE_SECRET_KEY=sb_secret_abc123def456ghi789...
   ```

3. **Verifique se:**
   - ✅ Não há espaços antes ou depois do `=`
   - ✅ Não há aspas nas chaves (a menos que a chave tenha aspas)
   - ✅ A URL está completa (começa com `https://`)
   - ✅ As chaves estão completas (não cortadas)

4. **Salve o arquivo** (Ctrl+S)

---

## ✅ **PASSO 4: Verificar se Está Correto**

Execute este comando para verificar:

```powershell
.\scripts\check-environment.ps1
```

Ou verifique manualmente:
- O arquivo `.env.local` existe na raiz do projeto
- As 4 variáveis obrigatórias estão preenchidas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`

---

## 🧪 **PASSO 5: Testar a Configuração**

Após preencher, teste se está funcionando:

```powershell
npm run dev
```

Se tudo estiver correto:
- O servidor iniciará sem erros
- Você verá: `Ready on http://localhost:3000`
- Não haverá erros relacionados ao Supabase

Se houver erros:
- Verifique se copiou as chaves completas
- Verifique se não há espaços extras
- Verifique se a URL está correta

---

## 🆘 **Problemas Comuns**

### ❌ Erro: "Invalid API key"
- **Causa:** Chave incompleta ou com espaços
- **Solução:** Copie a chave novamente, certifique-se de que está completa

### ❌ Erro: "Cannot connect to Supabase"
- **Causa:** URL incorreta ou projeto inativo
- **Solução:** Verifique se a URL está correta e se o projeto está ativo

### ❌ Erro: "Missing environment variables"
- **Causa:** Variável não preenchida ou nome incorreto
- **Solução:** Verifique se todas as 4 variáveis obrigatórias estão preenchidas

### ❌ Erro: "Permission denied"
- **Causa:** Chave errada ou sem permissões
- **Solução:** Use a chave `service_role` para `SUPABASE_SECRET_KEY`

---

## 📸 **Exemplo Visual**

Seu arquivo `.env.local` final deve parecer assim:

```env
# ============================================
# VARIÁVEIS DE AMBIENTE - Área do Aluno
# ============================================

# --------------------------------------------
# SUPABASE - OBRIGATÓRIAS
# --------------------------------------------

# URL do projeto Supabase (Project URL)
NEXT_PUBLIC_SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co

# Chave pública/anônima (anon/public key)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cWdm...

# URL do Supabase (mesma que acima, para uso no servidor)
SUPABASE_URL=https://wtqgfmtucqmpheghcvxo.supabase.co

# Chave secreta (service_role key) - ⚠️ NUNCA exponha no cliente!
SUPABASE_SECRET_KEY=sb_secret_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567...

# --------------------------------------------
# UPSTASH REDIS - OPCIONAIS
# --------------------------------------------
UPSTASH_REDIS_REST_URL=https://sua-instancia-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis_aqui

# --------------------------------------------
# API URL
# --------------------------------------------
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🎯 **Resumo Rápido**

1. ✅ Acesse: https://app.supabase.com/project/wtqgfmtucqmpheghcvxo/settings/api
2. ✅ Copie **Project URL** → use em `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
3. ✅ Copie **anon/public key** → use em `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
4. ✅ Copie **service_role key** → use em `SUPABASE_SECRET_KEY`
5. ✅ Salve o arquivo `.env.local`
6. ✅ Teste com `npm run dev`

---

**Precisa de mais ajuda?** Consulte `GUIA_ENV_LOCAL.md` ou `docs/ENV_VARIABLES.md`










