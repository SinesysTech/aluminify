'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, UserCog, GraduationCap, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/client'

import Link from 'next/link'

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

interface UserManagementProps {
  empresaId: string
}

export function UserManagement({ empresaId }: UserManagementProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('professores')
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Professores state
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loadingProfessores, setLoadingProfessores] = useState(true)
  const [professorDialogOpen, setProfessorDialogOpen] = useState(false)
  const [professorForm, setProfessorForm] = useState({
    email: '',
    fullName: '',
    password: '',
    isAdmin: false,
  })
  const [professorSearch, setProfessorSearch] = useState('')

  // Alunos state
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [alunoSearch, setAlunoSearch] = useState('')

  // Inicializar accessToken
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccessToken(session?.access_token ?? null)
    })
  }, [])

  // Fetch professores
  const fetchProfessores = useCallback(async () => {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresas/${empresaId}/professores`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setProfessores(data)
      }
    } catch (error) {
      console.error('Error fetching professores:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar professores',
        variant: 'destructive',
      })
    } finally {
      setLoadingProfessores(false)
    }
  }, [empresaId, toast, accessToken])

  // Fetch alunos
  const fetchAlunos = useCallback(async () => {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresas/${empresaId}/alunos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setAlunos(data)
      }
    } catch (error) {
      console.error('Error fetching alunos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alunos',
        variant: 'destructive',
      })
    } finally {
      setLoadingAlunos(false)
    }
  }, [empresaId, toast, accessToken])

  useEffect(() => {
    fetchProfessores()
    fetchAlunos()
  }, [fetchProfessores, fetchAlunos])

  // Create professor
  async function handleCreateProfessor() {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresas/${empresaId}/professores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(professorForm),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar professor')
      }

      toast({
        title: 'Sucesso',
        description: 'Professor criado com sucesso',
      })
      setProfessorDialogOpen(false)
      setProfessorForm({ email: '', fullName: '', password: '', isAdmin: false })
      fetchProfessores()
    } catch (error) {
      console.error('Error creating professor:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar professor',
        variant: 'destructive',
      })
    }
  }

  // Toggle admin status
  async function handleToggleAdmin(professorId: string, currentStatus: boolean) {
    if (!accessToken) return
    try {
      const response = await fetch(`/api/empresas/${empresaId}/professores/${professorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar professor')
      }

      toast({
        title: 'Sucesso',
        description: currentStatus ? 'PrivilÃ©gios de admin removidos' : 'Professor promovido a admin',
      })
      fetchProfessores()
    } catch (error) {
      console.error('Error toggling admin:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status de admin',
        variant: 'destructive',
      })
    }
  }

  // Filter functions
  const filteredProfessores = professores.filter(
    (p) =>
      p.fullName.toLowerCase().includes(professorSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(professorSearch.toLowerCase())
  )

  const filteredAlunos = alunos.filter(
    (a) =>
      a.fullName?.toLowerCase().includes(alunoSearch.toLowerCase()) ||
      a.email?.toLowerCase().includes(alunoSearch.toLowerCase())
  )

  const admins = professores.filter((p) => p.isAdmin)

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="professores" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Professores</span>
            <Badge variant="secondary" className="ml-1">
              {professores.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="alunos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Alunos</span>
            <Badge variant="secondary" className="ml-1">
              {alunos.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admins</span>
            <Badge variant="secondary" className="ml-1">
              {admins.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Professores Tab */}
        <TabsContent value="professores" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar professores..."
                value={professorSearch}
                onChange={(e) => setProfessorSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={professorDialogOpen} onOpenChange={setProfessorDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Professor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Professor</DialogTitle>
                  <DialogDescription>
                    Crie uma nova conta de professor para sua empresa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prof-email">Email</Label>
                    <Input
                      id="prof-email"
                      type="email"
                      value={professorForm.email}
                      onChange={(e) =>
                        setProfessorForm({ ...professorForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prof-fullName">Nome Completo</Label>
                    <Input
                      id="prof-fullName"
                      value={professorForm.fullName}
                      onChange={(e) =>
                        setProfessorForm({ ...professorForm, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prof-password">Senha TemporÃ¡ria</Label>
                    <Input
                      id="prof-password"
                      type="password"
                      value={professorForm.password}
                      onChange={(e) =>
                        setProfessorForm({ ...professorForm, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prof-isAdmin"
                      checked={professorForm.isAdmin}
                      onCheckedChange={(checked) =>
                        setProfessorForm({ ...professorForm, isAdmin: checked === true })
                      }
                    />
                    <Label htmlFor="prof-isAdmin">Ã‰ administrador?</Label>
                  </div>
                  <Button onClick={handleCreateProfessor} className="w-full">
                    Criar Professor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingProfessores ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredProfessores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {professorSearch
                ? 'Nenhum professor encontrado'
                : 'Nenhum professor cadastrado'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProfessores.map((prof) => (
                <div
                  key={prof.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {prof.fullName}
                        {prof.isAdmin && (
                          <Badge variant="default" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{prof.email}</div>
                    </div>
                  </div>
                  <Button
                    variant={prof.isAdmin ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleAdmin(prof.id, prof.isAdmin)}
                  >
                    {prof.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alunos Tab */}
        <TabsContent value="alunos" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos..."
                value={alunoSearch}
                onChange={(e) => setAlunoSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/empresa/alunos">
                <UserCog className="h-4 w-4 mr-2" />
                Gerenciar Alunos
              </Link>
            </Button>
          </div>

          {loadingAlunos ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {alunoSearch ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlunos.map((aluno) => (
                <div
                  key={aluno.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">{aluno.fullName || 'Sem nome'}</div>
                      <div className="text-sm text-muted-foreground">{aluno.email}</div>
                    </div>
                  </div>
                  <Badge variant={aluno.status === 'ativo' ? 'default' : 'secondary'}>
                    {aluno.status || 'Ativo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4 mt-4">
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">
              Administradores sÃ£o professores com privilÃ©gios elevados para gerenciar a empresa.
              Para adicionar um novo administrador, vÃ¡ atÃ© a aba de Professores e marque a opÃ§Ã£o &quot;Ã‰ administrador?&quot;
              ao criar ou editar um professor.
            </p>
          </div>

          {admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum administrador cadastrado
            </div>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-medium">{admin.fullName}</div>
                      <div className="text-sm text-muted-foreground">{admin.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleToggleAdmin(admin.id, true)}
                  >
                    Remover Admin
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
