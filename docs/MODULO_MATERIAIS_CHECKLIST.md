# Checklist: Módulo Área de Estudo e Gestão de Materiais

## ✅ Implementação Completa

### Backend
- [x] Migration SQL criada e aplicada
- [x] Tabelas `atividades` e `progresso_atividades` criadas
- [x] Enums criados
- [x] Stored Procedure `gerar_atividades_padrao` criada
- [x] RLS policies configuradas
- [x] Service layer completo
- [x] Repository pattern implementado
- [x] API routes criadas (GET, PATCH, POST gerar-estrutura)

### Frontend
- [x] Componentes UI criados
- [x] Página `/admin/materiais` criada
- [x] Upload direto no frontend implementado
- [x] Filtros de Disciplina > Frente funcionando
- [x] Accordions por módulo implementados

## ⏳ Próximos Passos (Configuração)

### 1. Criar Bucket no Supabase Storage

**Passos:**
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **Storage** no menu lateral
3. Clique em **Create bucket**
4. Configure:
   - **Nome**: `materiais_didaticos`
   - **Public bucket**: ✅ **Sim** (marcado)
   - Clique em **Create bucket**

### 2. Aplicar Políticas RLS do Storage

Após criar o bucket, execute a migration SQL das políticas:

**Opção A - Via SQL Editor no Dashboard:**
1. Acesse **SQL Editor** no Supabase Dashboard
2. Abra o arquivo: `supabase/migrations/20250131_create_materiais_didaticos_bucket_policies.sql`
3. Copie e cole o conteúdo
4. Execute a query

**Opção B - Via MCP (se disponível):**
```bash
# A migration já está criada, pode ser aplicada via MCP se configurado
```

### 3. Testar o Fluxo Completo

1. **Acessar a página:**
   - Faça login como professor
   - Acesse `/admin/materiais`

2. **Gerar estrutura:**
   - Selecione uma disciplina
   - Selecione uma frente
   - Clique em "Gerar Estrutura"
   - Verifique se os slots foram criados

3. **Fazer upload:**
   - Abra um accordion de módulo
   - Clique em "Enviar PDF" em uma atividade
   - Selecione um arquivo PDF (máximo 10MB)
   - Verifique se o upload foi bem-sucedido

4. **Verificar no Storage:**
   - Acesse Storage > materiais_didaticos
   - Verifique se o arquivo foi criado na pasta `{atividade_id}/`

## 📋 Arquivos Criados

### Migrations
- `supabase/migrations/20250131_create_atividades_tables.sql`
- `supabase/migrations/20250131_create_materiais_didaticos_bucket_policies.sql`

### Backend
- `backend/services/atividade/atividade.types.ts`
- `backend/services/atividade/atividade.repository.ts`
- `backend/services/atividade/atividade.service.ts`
- `backend/services/atividade/atividade.errors.ts`
- `backend/services/atividade/index.ts`

### API Routes
- `app/api/atividade/route.ts`
- `app/api/atividade/[id]/route.ts`
- `app/api/atividade/gerar-estrutura/route.ts`

### Componentes
- `components/materials-filters.tsx`
- `components/activity-upload-row.tsx`
- `components/module-accordion.tsx`

### Páginas
- `app/(dashboard)/admin/materiais/page.tsx`
- `app/(dashboard)/admin/materiais/materiais-client.tsx`
- `app/(dashboard)/admin/materiais/types.ts`

### Documentação
- `docs/PLANO_MODULO_MATERIAIS.md`
- `docs/MATERIAIS_DIDATICOS_BUCKET_SETUP.md`
- `docs/MODULO_MATERIAIS_CHECKLIST.md` (este arquivo)

## 🔧 Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket foi criado com o nome exato: `materiais_didaticos`
- Verifique se você está no projeto correto do Supabase

### Erro: "Permission denied" no upload
- Verifique se as políticas RLS do bucket foram aplicadas
- Verifique se o usuário está autenticado como professor
- Verifique se o bucket está marcado como público para leitura

### Erro: "File too large"
- O tamanho máximo é 10MB por arquivo
- Reduza o tamanho do PDF ou divida em partes menores

### Atividades não aparecem após gerar estrutura
- Verifique se a RPC `gerar_atividades_padrao` foi executada com sucesso
- Verifique os logs do console do navegador
- Recarregue a página

## ✨ Funcionalidades Implementadas

1. ✅ Geração automática de slots de atividades por módulo
2. ✅ Upload direto de PDFs (sem passar pelo servidor Next.js)
3. ✅ Visualização de PDFs em nova aba
4. ✅ Substituição de arquivos existentes
5. ✅ Interface tipo "álbum de figurinhas" (slots vazios até preencher)
6. ✅ Filtros de Disciplina > Frente
7. ✅ Accordions por módulo com contador de atividades completas
8. ✅ Validações de tipo de arquivo (PDF) e tamanho (10MB)

## 🎯 Status Final

**Código**: ✅ 100% Completo
**Banco de Dados**: ✅ Migration aplicada e verificada
**Bucket Storage**: ⏳ Aguardando criação manual no Dashboard
**Políticas RLS Storage**: ⏳ Aguardando aplicação após criação do bucket

