'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/app/shared/components/forms/input'
import { Label } from '@/app/shared/components/forms/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/app/shared/core/client'
import { AvatarUpload } from '@/app/shared/components/ui/avatar-upload'
import { Loader2 } from 'lucide-react'
import { formatBRPhone } from '@/shared/library/br'

interface ProfileData {
  nome_completo: string
  email: string
  telefone: string
  avatar_url: string | null
}

export default function PerfilClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
  })

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Buscar dados do usuarios via service role (já feito pelo GET /api/usuario/perfil)
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome_completo, email, telefone')
        .eq('id', session.user.id)
        .maybeSingle()

      const avatarUrl = session.user.user_metadata?.avatar_url || null
      const email = session.user.email || ''

      const data: ProfileData = {
        nome_completo:
          (usuario as { nome_completo: string } | null)?.nome_completo ||
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          '',
        email,
        telefone: (usuario as { telefone: string | null } | null)?.telefone || '',
        avatar_url: avatarUrl,
      }

      setProfile(data)
      setFormData({
        nome_completo: data.nome_completo,
        telefone: data.telefone || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu perfil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    if (!formData.nome_completo.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome não pode estar vazio.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/usuario/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome_completo: formData.nome_completo.trim(),
          telefone: formData.telefone.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar')
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas.',
      })

      // Atualizar dados locais
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              nome_completo: formData.nome_completo.trim(),
              telefone: formData.telefone.trim(),
            }
          : prev
      )

      // Notificar nav-user para atualizar nome
      window.dispatchEvent(new Event('avatar-updated'))
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Não foi possível salvar.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Não foi possível carregar seu perfil.
        </p>
      </div>
    )
  }

  const hasChanges =
    formData.nome_completo !== profile.nome_completo ||
    formData.telefone !== (profile.telefone || '')

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="page-title">Meu Perfil</h1>
        <p className="page-subtitle">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Foto de perfil</CardTitle>
            <CardDescription>Sua foto será exibida na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              userName={profile.nome_completo}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações pessoais</CardTitle>
            <CardDescription>
              Atualize seu nome e dados de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome completo</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nome_completo: e.target.value,
                  }))
                }
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado por aqui.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => {
                  const formatted = formatBRPhone(e.target.value)
                  setFormData((prev) => ({ ...prev, telefone: formatted }))
                }}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
