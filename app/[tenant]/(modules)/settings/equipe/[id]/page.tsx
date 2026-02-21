'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { UserDetails } from './components/user-details'

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

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [user, setUser] = React.useState<UserData | null>(null)
  const [empresaId, setEmpresaId] = React.useState<string | null>(null)
  const [papeis, setPapeis] = React.useState<Papel[]>([])

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get empresaId from profile
      const profileResponse = await fetch('/api/usuario/perfil')
      if (!profileResponse.ok) {
        throw new Error('Erro ao obter perfil')
      }
      const profileData = await profileResponse.json()

      if (!profileData.empresaId) {
        throw new Error('Empresa não encontrada')
      }

      setEmpresaId(profileData.empresaId)

      // Fetch user data and papeis in parallel
      const [userResponse, papeisResponse] = await Promise.all([
        fetch(`/api/empresa/${profileData.empresaId}/usuarios/${userId}`),
        fetch(`/api/empresa/${profileData.empresaId}/papeis`),
      ])

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao carregar usuário')
      }

      const userData = await userResponse.json()
      setUser(userData)

      if (papeisResponse.ok) {
        const papeisData = await papeisResponse.json()
        setPapeis(papeisData.papeis || [])
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do usuário')
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId, fetchData])

  if (loading) {
    return (
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !user || !empresaId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center min-h-100 gap-4 px-4 sm:px-6 lg:px-8">
        <p className="text-destructive">{error || 'Usuário não encontrado'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <UserDetails
      user={user}
      empresaId={empresaId}
      papeis={papeis}
      onUpdate={fetchData}
    />
  )
}
