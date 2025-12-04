# Configuração do Bucket de Materiais Didáticos

Este documento descreve como configurar o bucket `materiais_didaticos` no Supabase Storage para o módulo de Área de Estudo e Gestão de Materiais.

## Passos de Configuração

### 1. Criar o Bucket

1. Acesse o **Supabase Dashboard**
2. Vá para **Storage** no menu lateral
3. Clique em **Create bucket**
4. Configure:
   - **Nome**: `materiais_didaticos`
   - **Public bucket**: ✅ **Sim** (marcado)
   - Clique em **Create bucket**

### 2. Aplicar Políticas RLS

Após criar o bucket, execute a migration SQL que contém as políticas RLS:

```bash
# A migration já está criada em:
# supabase/migrations/20250131_create_materiais_didaticos_bucket_policies.sql
```

Ou execute diretamente no SQL Editor do Supabase Dashboard.

### 3. Estrutura de Pastas

Os arquivos são armazenados com a seguinte estrutura:

```
materiais_didaticos/
  {atividade_id}/
    {timestamp}-{nome_original}.pdf
```

Exemplo:
```
materiais_didaticos/
  550e8400-e29b-41d4-a716-446655440000/
    1706716800000-lista_exercicios_nivel1.pdf
```

### 4. Políticas RLS Configuradas

- **Professores**: Podem fazer INSERT, UPDATE e DELETE de arquivos
- **Público**: Pode fazer SELECT (leitura) de arquivos (bucket público)
- **Alunos**: Podem ler os arquivos através das URLs públicas

### 5. Validações no Frontend

O componente `ActivityUploadRow` valida:
- Tipo de arquivo: Apenas PDF (`application/pdf`)
- Tamanho máximo: 10MB

### 6. Upload Direto

O upload é feito **diretamente do frontend** para o Supabase Storage, sem passar pelo servidor Next.js:

1. Frontend valida o arquivo (tipo e tamanho)
2. Upload direto usando `supabase.storage.from('materiais_didaticos').upload(...)`
3. Após sucesso, obtém a URL pública
4. Chama `PATCH /api/atividade/[id]` para salvar a URL no banco

### 7. Verificação

Para verificar se está tudo funcionando:

1. Acesse a página `/admin/materiais`
2. Selecione uma disciplina e frente
3. Clique em "Gerar Estrutura"
4. Tente fazer upload de um PDF em uma atividade

## Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket foi criado com o nome exato: `materiais_didaticos`
- Verifique se você está no projeto correto do Supabase

### Erro: "Permission denied"
- Verifique se as políticas RLS foram aplicadas corretamente
- Verifique se o usuário está autenticado como professor
- Verifique se o bucket está marcado como público para leitura

### Erro: "File too large"
- O tamanho máximo é 10MB por arquivo
- Reduza o tamanho do PDF ou divida em partes menores

## Arquivos Relacionados

- Migration SQL: `supabase/migrations/20250131_create_materiais_didaticos_bucket_policies.sql`
- Componente de Upload: `components/activity-upload-row.tsx`
- Service Layer: `backend/services/atividade/`



