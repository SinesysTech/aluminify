# Configuração Rápida do Bucket de Avatares

## ⚠️ Erro: "Bucket de armazenamento não configurado"

Se você está vendo este erro, o bucket `avatars` ainda não foi criado no Supabase.

## Solução Rápida (Escolha uma opção)

### Opção 1: Via Supabase Dashboard (Mais Fácil) ⭐

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique no botão **"New bucket"** ou **"Create bucket"**
5. Configure:
   - **Name**: `avatars` (exatamente assim, em minúsculas)
   - **Public bucket**: ✅ **Marque esta opção** (importante!)
   - **File size limit**: `5242880` (5MB em bytes) ou deixe vazio
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp,image/gif` (opcional)
6. Clique em **"Create bucket"**

### Opção 2: Via API (Requer Service Role Key)

Se você tem a `SUPABASE_SERVICE_ROLE_KEY` configurada:

1. Adicione no arquivo `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

2. Execute no terminal:
   ```bash
   curl -X POST http://localhost:3000/api/user/avatar/create-bucket
   ```

   Ou acesse no navegador:
   ```
   http://localhost:3000/api/user/avatar/create-bucket
   ```

### Opção 3: Configurar Políticas RLS (Após criar o bucket)

Após criar o bucket, execute a migração SQL para configurar as políticas de segurança:

1. Acesse Supabase Dashboard > SQL Editor
2. Execute o arquivo: `supabase/migrations/20250130_create_avatars_bucket.sql`

Ou copie e cole o conteúdo do arquivo no SQL Editor.

## Verificação

Após criar o bucket, tente fazer upload de uma foto novamente. O erro deve desaparecer.

## Precisa de Ajuda?

Se ainda tiver problemas:
1. Verifique se o bucket foi criado: Supabase Dashboard > Storage
2. Verifique se o bucket está marcado como **Public**
3. Verifique se as políticas RLS foram aplicadas: Supabase Dashboard > Storage > Policies





