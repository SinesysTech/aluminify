'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'

import type { AppUser } from '@/types/user'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { AvatarUpload } from '@/components/shared/avatar-upload'
import { useToast } from '@/hooks/use-toast'

type ProfileSettingsProps = {
  user: AppUser
  section: 'dados' | 'seguranca' | 'avatar'
}

export function ProfileSettings({ user, section }: ProfileSettingsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [fullName, setFullName] = useState(user.fullName || '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!fullName.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O nome completo é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingProfile(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Dados atualizados',
        description: 'Suas informações foram salvas com sucesso.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar os dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!password) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite a nova senha.',
        variant: 'destructive',
      })
      return
    }

    if (password !== passwordConfirmation) {
      toast({
        title: 'Senhas diferentes',
        description: 'As senhas precisam ser iguais.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      })

      if (error) {
        throw error
      }

      // Atualizar must_change_password apenas se o usuário for aluno
      if (user.role === 'aluno') {
        const { error: alunoError } = await supabase
          .from('alunos')
          .update({ must_change_password: false, senha_temporaria: null })
          .eq('id', user.id)

        if (alunoError) {
          console.warn('Erro ao atualizar flag must_change_password na tabela alunos:', alunoError)
        }
      }

      setPassword('')
      setPasswordConfirmation('')

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi alterada com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar senha',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar a senha.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleAvatarSuccess = () => {
    toast({
      title: 'Avatar atualizado',
      description: 'Sua foto de perfil foi alterada com sucesso.',
    })
    router.refresh()
  }

  if (section === 'dados') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>
            Atualize como o seu nome aparece dentro da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="full_name">
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Como deseja ser identificado(a)?"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
              <p className="text-muted-foreground text-xs">
                Para alterar o email, entre em contato com o suporte.
              </p>
            </div>
            <Button type="submit" disabled={isSavingProfile} className="gap-2">
              {isSavingProfile ? (
                <>
                  <Spinner />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (section === 'seguranca') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Senha de acesso</CardTitle>
          <CardDescription>
            Defina uma nova senha sempre que achar necessário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Nova senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password_confirmation">
                Confirme a senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                placeholder="Digite novamente"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={isSavingPassword} className="gap-2">
              {isSavingPassword ? (
                <>
                  <Spinner />
                  Atualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Atualizar senha
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (section === 'avatar') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>
            Envie uma foto para personalizar seu avatar. A foto aparecerá em toda a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentAvatarUrl={user.avatarUrl}
            userName={user.fullName || user.email}
            onUploadSuccess={handleAvatarSuccess}
          />
        </CardContent>
      </Card>
    )
  }

  return null
}
