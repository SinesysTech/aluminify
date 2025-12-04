# Guia Passo a Passo: Configuração Manual do Bucket

Este guia mostra **exatamente** como configurar o bucket `materiais_didaticos` no Supabase Dashboard.

---

## 📋 Passo 1: Criar o Bucket

### 1.1. Acesse o Supabase Dashboard

1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login (se necessário)
4. **Selecione seu projeto** na lista de projetos

### 1.2. Navegue até Storage

1. No menu lateral esquerdo, procure por **"Storage"**
2. Clique em **"Storage"**

### 1.3. Criar Novo Bucket

1. Clique no botão **"Create bucket"** (geralmente no canto superior direito ou no centro da tela)
2. Uma modal/janela abrirá para configuração

### 1.4. Configurar o Bucket

Na modal de criação, preencha:

**Nome do bucket:**
```
materiais_didaticos
```
⚠️ **IMPORTANTE**: Use exatamente este nome (com underscore `_`, não hífen `-`)

**Public bucket:**
✅ **MARQUE ESTA CAIXA** (Muito importante!)

A opção "Public bucket" permite que os arquivos sejam acessíveis via URL pública, o que é necessário para os alunos visualizarem os PDFs.

### 1.5. Finalizar Criação

1. Clique em **"Create bucket"** ou **"Save"**
2. Aguarde a confirmação
3. O bucket deve aparecer na lista de buckets

---

## 📋 Passo 2: Aplicar as Políticas RLS

Agora você precisa aplicar as políticas de segurança (RLS) para permitir que professores façam upload e todos possam ler.

### 2.1. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** (se aparecer)

### 2.2. Copiar o SQL das Políticas

1. Abra o arquivo no seu computador:
   ```
   supabase/migrations/20250131_create_materiais_didaticos_bucket_policies.sql
   ```

2. **Copie TODO o conteúdo** do arquivo (Ctrl+A, Ctrl+C)

### 2.3. Colar e Executar

1. No SQL Editor do Supabase Dashboard, **cole** o conteúdo copiado (Ctrl+V)
2. Verifique se o SQL está completo (deve ter várias políticas CREATE POLICY)
3. Clique em **"Run"** ou pressione **Ctrl+Enter** (Windows) / **Cmd+Enter** (Mac)

### 2.4. Verificar Sucesso

Você deve ver uma mensagem de sucesso, algo como:
```
Success. No rows returned
```

Se houver erro, leia a mensagem de erro. Possíveis causas:
- Bucket não existe ainda (volte ao Passo 1)
- Nome do bucket está errado (deve ser `materiais_didaticos`)

---

## ✅ Verificação Final

### Verificar se o Bucket foi Criado

1. Vá para **Storage** no menu lateral
2. Você deve ver o bucket `materiais_didaticos` na lista
3. Clique nele para ver os detalhes
4. Verifique se está marcado como **"Public"**

### Verificar se as Políticas foram Aplicadas

1. Vá para **Storage** → **Policies**
2. Ou vá para **Authentication** → **Policies** → **Storage**
3. Você deve ver 4 políticas relacionadas a `materiais_didaticos`:
   - "Professores podem fazer upload de materiais" (INSERT)
   - "Leitura pública de materiais didáticos" (SELECT)
   - "Professores podem substituir materiais" (UPDATE)
   - "Professores podem remover materiais" (DELETE)

---

## 🧪 Teste Rápido

Após configurar, teste se está funcionando:

### 1. Teste de Upload (via Interface)

1. Acesse sua aplicação: `http://localhost:3000/admin/materiais`
2. Faça login como **professor**
3. Selecione uma disciplina
4. Selecione uma frente
5. Clique em **"Gerar Estrutura"**
6. Aguarde a confirmação
7. Abra um módulo no accordion
8. Clique em **"Enviar PDF"** em uma atividade
9. Selecione um arquivo PDF
10. Se o upload funcionar, está tudo configurado! ✅

### 2. Teste de Leitura

1. Após fazer upload, verifique:
   - O ícone de check verde aparece?
   - O nome do arquivo aparece?
   - O botão "Visualizar" abre o PDF em nova aba?

Se sim, está tudo funcionando! ✅

---

## 🐛 Problemas Comuns e Soluções

### Erro: "Bucket not found"

**Causa:** O bucket não foi criado ou tem nome diferente.

**Solução:**
1. Verifique se criou o bucket com o nome exato: `materiais_didaticos`
2. Verifique se está no projeto correto do Supabase
3. Tente criar o bucket novamente

### Erro: "Permission denied" ao fazer upload

**Causa:** As políticas RLS não foram aplicadas ou o usuário não é professor.

**Solução:**
1. Verifique se executou o SQL das políticas (Passo 2)
2. Verifique se está logado como professor (não aluno)
3. Verifique se o bucket está marcado como público
4. Recarregue a página

### Erro: "File too large"

**Causa:** O arquivo PDF tem mais de 10MB.

**Solução:**
1. Comprima o PDF
2. Ou divida em partes menores
3. O limite atual é 10MB (configurável no código)

### Arquivo não aparece após upload

**Causa:** Pode ser erro no upload ou ao salvar a URL no banco.

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros (aba Console)
3. Verifique a aba Network para ver as requisições
4. Verifique se o arquivo aparece no Storage do Supabase Dashboard

---

## 📝 Checklist Resumido

Marque cada item conforme completa:

- [ ] Acessei o Supabase Dashboard
- [ ] Naveguei até Storage
- [ ] Criei o bucket `materiais_didaticos`
- [ ] Marquei o bucket como **Público**
- [ ] Abri o SQL Editor
- [ ] Copiei o conteúdo de `20250131_create_materiais_didaticos_bucket_policies.sql`
- [ ] Colei e executei o SQL
- [ ] Verifiquei sucesso da execução
- [ ] Testei upload na interface
- [ ] Testei visualização do PDF
- [ ] Tudo funcionando! ✅

---

## 📞 Precisa de Ajuda?

Se tiver problemas:

1. **Verifique os logs:**
   - Console do navegador (F12)
   - Logs do Supabase Dashboard

2. **Verifique a documentação:**
   - `docs/MATERIAIS_DIDATICOS_BUCKET_SETUP.md`
   - `docs/PROXIMOS_PASSOS_MATERIAIS.md`

3. **Verifique o código:**
   - O bucket está definido como `materiais_didaticos` no código
   - Arquivo: `components/activity-upload-row.tsx` (linha ~11)

---

## 🎉 Pronto!

Após completar todos os passos, o módulo de materiais estará 100% funcional!



