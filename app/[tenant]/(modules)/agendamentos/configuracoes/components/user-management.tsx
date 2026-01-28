'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, GraduationCap, Users, Shield, Briefcase, BookOpen, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/app/shared/components/forms/input'
import { Label } from '@/app/shared/components/forms/label'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/shared/components/overlay/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/forms/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/app/shared/core/client'
import Link from 'next/link'
import type { RoleTipo } from '@/app/shared/types/entities/papel'

interface Usuario {
  id: string
  nomeCompleto: string
  email: string
  papelId: string
  papel?: {
    id: string
    nome: string
    tipo: RoleTipo
  }
  ativo: boolean
}

interface Papel {
  id: string
  nome: string
  tipo: RoleTipo
  descricao: string | null
  isSystem: boolean
}

interface UserManagementProps {
  empresaId: string
}

// Mapeamento de tipos de papel para labels e ícones - cores sólidas com texto branco
const ROLE_CONFIG: Record<RoleTipo, { label: string; icon: React.ElementType; color: string }> = {
  professor: { label: 'Professor', icon: GraduationCap, color: 'bg-blue-500 text-white' },
  professor_admin: { label: 'Professor Admin', icon: GraduationCap, color: 'bg-purple-500 text-white' },
  staff: { label: 'Staff', icon: Briefcase, color: 'bg-emerald-500 text-white' },
  admin: { label: 'Administrador', icon: Shield, color: 'bg-amber-500 text-white' },
  monitor: { label: 'Monitor', icon: BookOpen, color: 'bg-cyan-500 text-white' },
}

export function UserManagement({ empresaId }: UserManagementProps) {
  const { toast } = useToast()
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Usuarios (equipe) state
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [papeis, setPapeis] = useState<Papel[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false)
  const [usuarioForm, setUsuarioForm] = useState({
    email: '',
    nomeCompleto: '',
    password: '',
    papelId: '',
  })
  const [usuarioSearch, setUsuarioSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleTipo | 'all'>('all')

  // Inicializar accessToken
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccessToken(session?.access_token ?? null)
    })
  }, [])

  // Fetch papeis (roles)
  const fetchPapeis = useCallback(async () => {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresa/${empresaId}/papeis`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPapeis(data)
      }
    } catch (error) {
      console.error('Error fetching papeis:', error)
    }
  }, [empresaId, accessToken])

  // Fetch usuarios (equipe)
  const fetchUsuarios = useCallback(async () => {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresa/${empresaId}/usuarios`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar equipe',
        variant: 'destructive',
      })
    } finally {
      setLoadingUsuarios(false)
    }
  }, [empresaId, toast, accessToken])

  useEffect(() => {
    fetchPapeis()
    fetchUsuarios()
  }, [fetchPapeis, fetchUsuarios])

  // Create usuario
  async function handleCreateUsuario() {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresa/${empresaId}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(usuarioForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
      })
      setUsuarioDialogOpen(false)
      setUsuarioForm({ email: '', nomeCompleto: '', password: '', papelId: '' })
      fetchUsuarios()
    } catch (error) {
      console.error('Error creating usuario:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar usuário',
        variant: 'destructive',
      })
    }
  }

  // Update usuario papel
  async function handleUpdatePapel(usuarioId: string, novoPapelId: string) {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresa/${empresaId}/usuarios/${usuarioId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ papelId: novoPapelId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar papel')
      }

      toast({
        title: 'Sucesso',
        description: 'Papel atualizado com sucesso',
      })
      fetchUsuarios()
    } catch (error) {
      console.error('Error updating papel:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar papel',
        variant: 'destructive',
      })
    }
  }

  // Filter function
  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch =
      u.nomeCompleto.toLowerCase().includes(usuarioSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(usuarioSearch.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.papel?.tipo === roleFilter
    return matchesSearch && matchesRole
  })

  // Get role config for a usuario
  const getRoleConfig = (tipo?: RoleTipo) => {
    if (!tipo) return ROLE_CONFIG.professor
    return ROLE_CONFIG[tipo] || ROLE_CONFIG.professor
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Equipe</h2>
        <Badge variant="secondary">{usuarios.length}</Badge>
      </div>

      {/* Search, Filter and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na equipe..."
              value={usuarioSearch}
              onChange={(e) => setUsuarioSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleTipo | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="professor_admin">Professor Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="monitor">Monitor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={usuarioDialogOpen} onOpenChange={setUsuarioDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Equipe</DialogTitle>
              <DialogDescription>
                Crie uma nova conta para um membro da equipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={usuarioForm.email}
                  onChange={(e) =>
                    setUsuarioForm({ ...usuarioForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-nomeCompleto">Nome Completo</Label>
                <Input
                  id="user-nomeCompleto"
                  value={usuarioForm.nomeCompleto}
                  onChange={(e) =>
                    setUsuarioForm({ ...usuarioForm, nomeCompleto: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Senha Temporária</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={usuarioForm.password}
                  onChange={(e) =>
                    setUsuarioForm({ ...usuarioForm, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-papel">Papel</Label>
                <Select
                  value={usuarioForm.papelId}
                  onValueChange={(v) => setUsuarioForm({ ...usuarioForm, papelId: v })}
                >
                  <SelectTrigger id="user-papel">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    {papeis.map((papel) => (
                      <SelectItem key={papel.id} value={papel.id}>
                        <div className="flex items-center gap-2">
                          <span>{papel.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            ({ROLE_CONFIG[papel.tipo]?.label || papel.tipo})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateUsuario}
                className="w-full"
                disabled={!usuarioForm.email || !usuarioForm.nomeCompleto || !usuarioForm.password || !usuarioForm.papelId}
              >
                Criar Membro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members List */}
      {loadingUsuarios ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : filteredUsuarios.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {usuarioSearch || roleFilter !== 'all'
            ? 'Nenhum membro encontrado'
            : 'Nenhum membro cadastrado'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsuarios.map((usuario) => {
            const roleConfig = getRoleConfig(usuario.papel?.tipo)
            const RoleIcon = roleConfig.icon
            const isAdmin = usuario.papel?.tipo === 'admin' || usuario.papel?.tipo === 'professor_admin'
            return (
              <div
                key={usuario.id}
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${roleConfig.color}`}>
                    <RoleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {usuario.nomeCompleto}
                      <Badge variant={isAdmin ? 'default' : 'outline'} className="text-xs">
                        {usuario.papel?.nome || 'Sem papel'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{usuario.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/usuario/equipe/${usuario.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Perfil
                    </Link>
                  </Button>
                  <Select
                    value={usuario.papelId}
                    onValueChange={(v) => handleUpdatePapel(usuario.id, v)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
