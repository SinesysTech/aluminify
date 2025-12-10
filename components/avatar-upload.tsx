'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/client'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userName: string
  onUploadSuccess?: (avatarUrl: string) => void
  className?: string
}

export const AvatarUpload = ({
  currentAvatarUrl,
  userName,
  onUploadSuccess,
  className,
}: AvatarUploadProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    setError(null)
    setIsUploading(true)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Se for erro de bucket não configurado, mostrar mensagem mais útil
        if (errorData.error === 'Bucket de armazenamento não configurado') {
          const instructions = errorData.instructions || errorData.options || []
          throw new Error(
            `${errorData.error}\n\n${errorData.message || ''}\n\n${instructions.join('\n')}`
          )
        }
        
        throw new Error(errorData.error || errorData.message || 'Erro ao fazer upload')
      }

      const data = await response.json()
      setAvatarUrl(data.avatar_url)
      setPreview(null)
      
      // Atualizar sessão para refletir mudanças
      await supabase.auth.refreshSession()
      
      if (onUploadSuccess) {
        onUploadSuccess(data.avatar_url)
      }
      
      // Forçar atualização do componente pai
      window.dispatchEvent(new Event('avatar-updated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
      setPreview(null)
    } finally {
      setIsUploading(false)
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Não autenticado')
      }

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao remover avatar')
      }

      setAvatarUrl(null)
      setPreview(null)
      
      // Atualizar sessão
      await supabase.auth.refreshSession()
      
      // Forçar atualização do componente pai
      window.dispatchEvent(new Event('avatar-updated'))
      
      if (onUploadSuccess) {
        onUploadSuccess('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover avatar')
    }
  }

  const displayUrl = preview || avatarUrl

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt={userName} />
          <AvatarFallback className="text-lg">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {avatarUrl ? 'Alterar foto' : 'Enviar foto'}
          </Button>
          
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Formatos aceitos: JPEG, PNG, WEBP, GIF. Tamanho máximo: 5MB
        </p>
      </div>
    </div>
  )
}

