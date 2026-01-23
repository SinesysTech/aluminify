'use client'

import * as React from 'react'
import { ArrowLeft, Loader2, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface Papel {
  id: string
  nome: string
  tipo: string
  descricao: string | null
}

interface UserData {
  id: string
  empresaId: string
  papelId: string
  papel?: Papel
  nomeCompleto: string
  email: string
  cpf: string | null
  telefone: string | null
  chavePix: string | null
  fotoUrl: string | null
  biografia: string | null
  especialidade: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

interface UserEditFormProps {
  user: UserData
  empresaId: string
  papeis: Papel[]
  onCancel: () => void
  onSuccess: () => void
}

export function UserEditForm({ user, empresaId, papeis, onCancel, onSuccess }: UserEditFormProps) {
  const [saving, setSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    nomeCompleto: user.nomeCompleto,
    email: user.email,
    cpf: user.cpf || '',
    telefone: user.telefone || '',
    chavePix: user.chavePix || '',
    fotoUrl: user.fotoUrl || '',
    biografia: user.biografia || '',
    especialidade: user.especialidade || '',
    papelId: user.papelId,
    ativo: user.ativo,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        nomeCompleto: formData.nomeCompleto,
        email: formData.email,
        cpf: formData.cpf || null,
        telefone: formData.telefone || null,
        chavePix: formData.chavePix || null,
        fotoUrl: formData.fotoUrl || null,
        biografia: formData.biografia || null,
        especialidade: formData.especialidade || null,
        papelId: formData.papelId,
        ativo: formData.ativo,
      }

      const response = await fetch(`/api/empresas/${empresaId}/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao atualizar usuário')
      }

      toast({
        title: 'Usuário atualizado',
        description: 'Os dados do usuário foram atualizados com sucesso.',
      })

      onSuccess()
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o usuário.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[#E4E4E7] pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2"
          onClick={onCancel}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Editar Usuário</h1>
            <p className="text-muted-foreground">{user.nomeCompleto}</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informacoes Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                  placeholder="Nome do usuário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade}
                  onChange={(e) => handleChange('especialidade', e.target.value)}
                  placeholder="Ex: Matemática, Física..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chavePix">Chave PIX</Label>
                <Input
                  id="chavePix"
                  value={formData.chavePix}
                  onChange={(e) => handleChange('chavePix', e.target.value)}
                  placeholder="CPF, email, telefone ou chave aleatória"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fotoUrl">URL da Foto</Label>
                <Input
                  id="fotoUrl"
                  value={formData.fotoUrl}
                  onChange={(e) => handleChange('fotoUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Biografia */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Biografia</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="biografia"
                value={formData.biografia}
                onChange={(e) => handleChange('biografia', e.target.value)}
                placeholder="Descrição profissional, experiência, formação..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Configuracoes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="papelId">Papel/Função *</Label>
                  <Select
                    value={formData.papelId}
                    onValueChange={(value) => handleChange('papelId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {papeis.map((papel) => (
                        <SelectItem key={papel.id} value={papel.id}>
                          {papel.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Status</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.ativo ? 'Usuário ativo no sistema' : 'Usuário desativado'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleChange('ativo', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
