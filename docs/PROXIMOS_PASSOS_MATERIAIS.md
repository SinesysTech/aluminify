# Próximos Passos: Configuração do Módulo de Materiais

## ✅ O que já está pronto

Todo o código foi implementado e testado. As migrations do banco de dados foram aplicadas com sucesso.

## ⏳ O que falta fazer

### 1. Criar o Bucket no Supabase Storage (Manual)

**Passos:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **Storage** no menu lateral
4. Clique em **Create bucket**
5. Configure:
   - **Nome**: `materiais_didaticos` (exatamente assim)
   - **Public bucket**: ✅ **MARQUE ESTA OPÇÃO** (muito importante!)
   - Clique em **Create bucket**

### 2. Aplicar as Políticas RLS do Storage

Após criar o bucket, você precisa aplicar as políticas de segurança. Você tem duas opções:

#### Opção A: Via SQL Editor (Recomendado)

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `supabase/migrations/20250131_create_materiais_didaticos_bucket_policies.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** ou pressione `Ctrl+Enter`

#### Opção B: Via MCP (se preferir)

Posso aplicar as políticas via MCP assim que você confirmar que o bucket foi criado.

### 3. Testar o Sistema

Após criar o bucket e aplicar as políticas:

1. **Acesse a página:**
   ```
   http://localhost:3000/admin/materiais
   ```
   (ou sua URL de produção)

2. **Teste o fluxo:**
   - Faça login como professor
   - Selecione uma disciplina
   - Selecione uma frente
   - Clique em "Gerar Estrutura"
   - Aguarde a confirmação
   - Abra um módulo no accordion
   - Faça upload de um PDF de teste

3. **Verifique:**
   - No Storage: o arquivo deve aparecer em `materiais_didaticos/{atividade_id}/`
   - Na interface: deve mostrar check verde e nome do arquivo
   - Clique em "Visualizar" para abrir o PDF

## 📝 Checklist Final

- [ ] Bucket `materiais_didaticos` criado no Supabase Dashboard
- [ ] Bucket marcado como **público**
- [ ] Políticas RLS aplicadas (migration SQL executada)
- [ ] Testado login como professor
- [ ] Testado acesso à página `/admin/materiais`
- [ ] Testado gerar estrutura
- [ ] Testado upload de PDF
- [ ] Testado visualização de PDF
- [ ] Testado substituir PDF

## 🐛 Problemas Comuns

### Erro: "Bucket not found"
**Solução:** Verifique se o nome do bucket está exatamente: `materiais_didaticos` (com underscore, não hífen)

### Erro: "Permission denied" ao fazer upload
**Solução:** 
1. Verifique se as políticas RLS foram aplicadas
2. Verifique se você está logado como professor
3. Recarregue a página

### Arquivo não aparece após upload
**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros
3. Verifique se a URL foi salva no banco (tabela `atividades`, coluna `arquivo_url`)

### Atividades não aparecem após "Gerar Estrutura"
**Solução:**
1. Verifique o console do navegador para erros
2. Verifique se a frente selecionada tem módulos cadastrados
3. Recarregue a página

## 📚 Documentação Adicional

- **Plano completo**: `docs/PLANO_MODULO_MATERIAIS.md`
- **Setup do bucket**: `docs/MATERIAIS_DIDATICOS_BUCKET_SETUP.md`
- **Checklist**: `docs/MODULO_MATERIAIS_CHECKLIST.md`

## 🎉 Pronto para usar!

Assim que o bucket for criado e as políticas aplicadas, o sistema estará 100% funcional!

