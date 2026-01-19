'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Settings, GraduationCap, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Professor {
  id: string
  fullName: string
  email: string
  isAdmin: boolean
}

interface Aluno {
  id: string
  fullName: string | null
  email: string
  status?: string
}

type UserType = 'todos' | 'professores' | 'alunos' | 'admins'

interface CombinedUser {
  id: string
  name: string
  email: string
  type: 'professor' | 'aluno'
  isAdmin: boolean
  status?: string
}

export default function EmpresaUsuariosPage() {
  const { toast } = useToast()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<UserType>('todos')

  const fetchData = useCallback(async () => {
    try {
      const userResponse = await fetch('/api/user/profile')
      const userData = await userResponse.json()

      if (userData.empresaId) {
        const [professoresRes, alunosRes] = await Promise.all([
          fetch(`/api/empresas/${userData.empresaId}/professores`),
          fetch(`/api/empresas/${userData.empresaId}/alunos`),
        ])

        if (professoresRes.ok) {
          const professoresData = await professoresRes.json()
          setProfessores(professoresData)
        }

        if (alunosRes.ok) {
          const alunosData = await alunosRes.json()
          setAlunos(alunosData)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Combine and filter users
  const combinedUsers: CombinedUser[] = [
    ...professores.map((p) => ({
      id: p.id,
      name: p.fullName,
      email: p.email,
      type: 'professor' as const,
      isAdmin: p.isAdmin,
    })),
    ...alunos.map((a) => ({
      id: a.id,
      name: a.fullName || 'Sem nome',
      email: a.email,
      type: 'aluno' as const,
      isAdmin: false,
      status: a.status,
    })),
  ]

  const filteredUsers = combinedUsers.filter((user) => {
    // Filter by search
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())

    // Filter by type
    let matchesType = true
    switch (filterType) {
      case 'professores':
        matchesType = user.type === 'professor'
        break
      case 'alunos':
        matchesType = user.type === 'aluno'
        break
      case 'admins':
        matchesType = user.isAdmin
        break
      default:
        matchesType = true
    }

    return matchesSearch && matchesType
  })

  // Stats
  const stats = {
    total: combinedUsers.length,
    professores: professores.length,
    alunos: alunos.length,
    admins: professores.filter((p) => p.isAdmin).length,
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Usuarios da Empresa</h1>
          <p className="page-subtitle">
            Visualize todos os usuarios da sua empresa
          </p>
        </div>
        <Button asChild>
          <Link href="/empresa/configuracoes?tab=usuarios">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar UsuÃ¡rios
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Professores</CardDescription>
            <CardTitle className="text-2xl">{stats.professores}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alunos</CardDescription>
            <CardTitle className="text-2xl">{stats.alunos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-2xl">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de UsuÃ¡rios</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuÃ¡rio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as UserType)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="professores">Professores</SelectItem>
                <SelectItem value="alunos">Alunos</SelectItem>
                <SelectItem value="admins">Administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || filterType !== 'todos'
                ? 'Nenhum usuÃ¡rio encontrado com os filtros aplicados'
                : 'Nenhum usuÃ¡rio cadastrado'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={`${user.type}-${user.id}`}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        user.type === 'professor'
                          ? user.isAdmin
                            ? 'bg-amber-500/10'
                            : 'bg-primary/10'
                          : 'bg-blue-500/10'
                      }`}
                    >
                      {user.isAdmin ? (
                        <Shield
                          className={`h-5 w-5 ${
                            user.isAdmin ? 'text-amber-500' : 'text-primary'
                          }`}
                        />
                      ) : user.type === 'professor' ? (
                        <GraduationCap className="h-5 w-5 text-primary" />
                      ) : (
                        <Users className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.isAdmin && (
                          <Badge variant="default" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Badge variant={user.type === 'professor' ? 'secondary' : 'outline'}>
                    {user.type === 'professor' ? 'Professor' : 'Aluno'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
