import { NextResponse } from 'next/server'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

/**
 * Endpoint para criar o bucket de avatares
 * Requer service_role key (apenas para administradores)
 * Este endpoint pode ser chamado uma vez para configurar o bucket
 */
export async function POST() {
  try {
    // Verificar se temos service_role key (suporta ambos os nomes)
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error: 'Service role key não configurada',
          message: 'Este endpoint requer SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente'
        },
        { status: 500 }
      )
    }

    // Criar cliente com service_role para ter permissões administrativas
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o bucket já existe
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET)
    
    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: 'Bucket já existe',
        bucket: AVATAR_BUCKET
      })
    }

    // Criar o bucket
    const { data, error } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })

    if (error) {
      console.error('Error creating bucket:', error)
      return NextResponse.json(
        { error: 'Erro ao criar bucket', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bucket criado com sucesso',
      bucket: AVATAR_BUCKET,
      data
    })
  } catch (error) {
    console.error('Bucket creation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}





