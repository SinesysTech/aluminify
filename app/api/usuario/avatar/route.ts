import { createClient } from '@/app/shared/core/server'
import { NextResponse } from 'next/server'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.' },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 5MB' },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    console.log('[Avatar Upload] Tentando fazer upload:', {
      bucket: AVATAR_BUCKET,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id
    })

    // Converter File para Blob para upload
    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: file.type })

    // Upload do arquivo diretamente - o bucket já existe e está configurado
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, blob, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name
      })
      
      // Se o erro for relacionado ao bucket não existir ou permissão
      if (uploadError.message?.includes('Bucket not found') || 
          uploadError.message?.includes('does not exist') ||
          uploadError.message?.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Bucket de armazenamento não configurado',
            message: 'O bucket "avatars" não foi encontrado ou não está acessível.',
            instructions: [
              '1. Verifique no Supabase Dashboard > Storage se o bucket "avatars" existe e está público',
              '2. Se não existir, crie: Storage > Create bucket > Nome: "avatars" > Public: true',
              '3. Verifique se as políticas RLS foram aplicadas corretamente'
            ],
            details: uploadError.message
          },
          { status: 500 }
        )
      }
      
      // Se for erro de permissão
      if (uploadError.message?.includes('permission') || 
          uploadError.message?.includes('policy')) {
        return NextResponse.json(
          { 
            error: 'Erro de permissão',
            message: 'Você não tem permissão para fazer upload neste bucket.',
            details: uploadError.message,
            suggestion: 'Verifique se as políticas RLS do bucket "avatars" estão configuradas corretamente.'
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Erro ao fazer upload do arquivo', 
          details: uploadError.message,
          fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(uploadError, null, 2) : undefined
        },
        { status: 500 }
      )
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Atualizar user_metadata com a URL do avatar
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    })

    if (updateError) {
      console.error('Update error:', updateError)
      // Tentar deletar o arquivo se a atualização falhar
      await supabase.storage.from(AVATAR_BUCKET).remove([filePath])
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    // Deletar avatar antigo se existir (opcional - pode manter histórico)
    // Por enquanto, vamos manter os avatares antigos

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Remover avatar do user_metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    })

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao remover avatar' },
        { status: 500 }
      )
    }

    // Opcional: deletar arquivos do storage (buscar por prefixo do user.id)
    const { data: files } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list('', {
        search: user.id,
      })

    if (files && files.length > 0) {
      const filePaths = files.map(file => file.name)
      await supabase.storage.from(AVATAR_BUCKET).remove(filePaths)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

