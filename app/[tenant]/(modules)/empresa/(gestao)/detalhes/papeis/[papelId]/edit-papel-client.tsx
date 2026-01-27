'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PapelForm, PermissionsMatrix } from '@/app/[tenant]/(modules)/empresa/(gestao)/components'
import type { Papel, RoleTipo, RolePermissions } from '@/app/shared/types/entities/papel'
import { toast } from 'sonner'

interface EditPapelClientProps {
  papel: Papel
  empresaId: string
}

export function EditPapelClient({ papel, empresaId }: EditPapelClientProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: {
    nome: string
    tipo: RoleTipo
    descricao?: string
    permissoes: RolePermissions
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/empresa/${empresaId}/papeis/${papel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: data.nome,
          descricao: data.descricao,
          permissoes: data.permissoes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar papel')
      }

      toast.success('Papel atualizado com sucesso')
      router.push(tenant ? `/${tenant}/empresa/detalhes/papeis` : '/empresa/detalhes/papeis')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar papel')
    } finally {
      setIsLoading(false)
    }
  }

  // If it's a system role, show read-only view
  if (papel.isSystem) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{papel.nome}</h1>
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Sistema
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {papel.descricao || 'Papel do sistema'}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Este é um papel do sistema e não pode ser editado ou excluído.
            As permissões abaixo são aplicadas automaticamente a todos os usuários
            com este papel.
          </p>
        </div>

        {/* Read-only permissions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Permissões</h2>
          <PermissionsMatrix permissions={papel.permissoes} readonly />
        </div>

        {/* Back button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  // Editable form for custom roles
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Papel</h1>
          <p className="text-muted-foreground">
            Atualize as informações e permissões do papel
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-6">
        <PapelForm
          papel={papel}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
