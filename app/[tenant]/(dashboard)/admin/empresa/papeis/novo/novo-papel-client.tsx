'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PapelForm } from '@/components/admin'
import type { RoleTipo, RolePermissions } from '@/types/shared/entities/papel'
import { toast } from 'sonner'

interface NovoPapelClientProps {
  empresaId: string
}

export function NovoPapelClient({ empresaId }: NovoPapelClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: {
    nome: string
    tipo: RoleTipo
    descricao?: string
    permissoes: RolePermissions
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/empresas/${empresaId}/papeis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar papel')
      }

      toast.success('Papel criado com sucesso')
      router.push('/admin/empresa/papeis')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar papel')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Papel</h1>
          <p className="text-muted-foreground">
            Crie um papel customizado com permissões específicas
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-6">
        <PapelForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
