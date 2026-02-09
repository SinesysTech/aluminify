'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/app/shared/components/forms/input'
import { Label } from '@/app/shared/components/forms/label'
import { Switch } from '@/app/shared/components/forms/switch'
import { toast } from '@/hooks/use-toast'
import { apiClient } from '@/shared/library/api-client'

interface StudentData {
  id: string
  empresaId: string | null
  fullName: string | null
  email: string
  cpf: string | null
  phone: string | null
  birthDate: string | null
  address: string | null
  zipCode: string | null
  cidade: string | null
  estado: string | null
  bairro: string | null
  pais: string | null
  numeroEndereco: string | null
  complemento: string | null
  enrollmentNumber: string | null
  instagram: string | null
  twitter: string | null
  hotmartId: string | null
  origemCadastro: string | null
  courses: { id: string; name: string }[]
  courseIds: string[]
  mustChangePassword: boolean
  temporaryPassword: string | null
  createdAt: string
  updatedAt: string
  quotaExtra?: number
}

interface StudentEditFormProps {
  student: StudentData
  onCancel: () => void
  onSuccess: () => void
}

export function StudentEditForm({ student, onCancel, onSuccess }: StudentEditFormProps) {
  const _router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    fullName: student.fullName || '',
    email: student.email,
    cpf: student.cpf || '',
    phone: student.phone || '',
    birthDate: student.birthDate || '',
    address: student.address || '',
    zipCode: student.zipCode || '',
    cidade: student.cidade || '',
    estado: student.estado || '',
    bairro: student.bairro || '',
    pais: student.pais || '',
    numeroEndereco: student.numeroEndereco || '',
    complemento: student.complemento || '',
    enrollmentNumber: student.enrollmentNumber || '',
    instagram: student.instagram || '',
    twitter: student.twitter || '',
    mustChangePassword: student.mustChangePassword,
    temporaryPassword: '',
    quotaExtra: student.quotaExtra ?? 0,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: Record<string, unknown> = {
        fullName: formData.fullName || null,
        email: formData.email,
        cpf: formData.cpf || null,
        phone: formData.phone || null,
        birthDate: formData.birthDate || null,
        address: formData.address || null,
        zipCode: formData.zipCode || null,
        enrollmentNumber: formData.enrollmentNumber || null,
        instagram: formData.instagram || null,
        twitter: formData.twitter || null,
        mustChangePassword: formData.mustChangePassword,
        quotaExtra: Number(formData.quotaExtra),
      }

      if (formData.temporaryPassword) {
        payload.temporaryPassword = formData.temporaryPassword
      }

      await apiClient.put(`/api/usuario/alunos/${student.id}`, payload)

      toast({
        title: 'Aluno atualizado',
        description: 'Os dados do aluno foram atualizados com sucesso.',
      })

      onSuccess()
    } catch (error: unknown) {
      console.error('Error updating student:', error)
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível atualizar o aluno.'
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: errorMessage,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border/40 pb-4">
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
            <h1 className="page-title">Editar Aluno</h1>
            <p className="page-subtitle">{student.fullName || student.email}</p>
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
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Nome do aluno"
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
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollmentNumber">Número de matrícula</Label>
                <Input
                  id="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={(e) => handleChange('enrollmentNumber', e.target.value)}
                  placeholder="Matrícula do aluno"
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
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="@usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  placeholder="@usuario"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quotaExtra">Quota Extra de Plantão</Label>
                <Input
                  id="quotaExtra"
                  type="number"
                  min="0"
                  value={formData.quotaExtra}
                  onChange={(e) => handleChange('quotaExtra', e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade de plantões extras que o aluno pode agendar além do limite do curso.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Endereco */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroEndereco">Número</Label>
                  <Input
                    id="numeroEndereco"
                    value={formData.numeroEndereco}
                    onChange={(e) => handleChange('numeroEndereco', e.target.value)}
                    placeholder="Nº"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                  placeholder="Apto, Bloco..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
                  placeholder="Bairro"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    placeholder="UF"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  value={formData.pais}
                  onChange={(e) => handleChange('pais', e.target.value)}
                  placeholder="Brasil"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seguranca */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Forçar troca de senha</Label>
                  <p className="text-xs text-muted-foreground">
                    O aluno será obrigado a trocar a senha no próximo login
                  </p>
                </div>
                <Switch
                  checked={formData.mustChangePassword}
                  onCheckedChange={(checked) => handleChange('mustChangePassword', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temporaryPassword">Nova senha temporária</Label>
                <Input
                  id="temporaryPassword"
                  type="text"
                  value={formData.temporaryPassword}
                  onChange={(e) => handleChange('temporaryPassword', e.target.value)}
                  placeholder="Deixe vazio para manter a atual"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres. Deixe vazio se não quiser alterar.
                </p>
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
