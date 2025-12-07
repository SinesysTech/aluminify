'use client'

import * as React from 'react'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, Loader2, Search, X, AlertCircle } from 'lucide-react'
import { FlashcardUploadCard } from '@/components/flashcard-upload-card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Alert } from '@/components/ui/alert'

type Flashcard = {
  id: string
  modulo_id: string
  pergunta: string
  resposta: string
  created_at: string
  modulo: {
    id: string
    nome: string
    numero_modulo: number | null
    frente: {
      id: string
      nome: string
      disciplina: {
        id: string
        nome: string
      }
    }
  }
}

type Disciplina = {
  id: string
  nome: string
}

type Frente = {
  id: string
  nome: string
  disciplina_id: string
}

type Curso = {
  id: string
  nome: string
}

type Modulo = {
  id: string
  nome: string
  numero_modulo: number | null
  frente_id: string
}


export default function FlashcardsAdminClient() {
  const supabase = createClient()

  const [flashcards, setFlashcards] = React.useState<Flashcard[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Filtros
  const [disciplinaId, setDisciplinaId] = React.useState<string | undefined>(undefined)
  const [frenteId, setFrenteId] = React.useState<string | undefined>(undefined)
  const [moduloId, setModuloId] = React.useState<string | undefined>(undefined)
  const [search, setSearch] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const limit = 20

  // Dados para filtros
  const [cursos, setCursos] = React.useState<Curso[]>([])
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
  const [frentes, setFrentes] = React.useState<Frente[]>([])
  const [modulos, setModulos] = React.useState<Modulo[]>([])
  const [loadingCursos, setLoadingCursos] = React.useState(false)
  const [loadingDisciplinas, setLoadingDisciplinas] = React.useState(false)
  const [loadingFrentes, setLoadingFrentes] = React.useState(false)
  const [loadingModulos, setLoadingModulos] = React.useState(false)

  // Modais
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedFlashcard, setSelectedFlashcard] = React.useState<Flashcard | null>(null)

  // Formulário
  const [formModuloId, setFormModuloId] = React.useState<string | undefined>(undefined)
  const [formPergunta, setFormPergunta] = React.useState<string>('')
  const [formResposta, setFormResposta] = React.useState<string>('')
  const [saving, setSaving] = React.useState(false)


  const fetchWithAuth = React.useCallback(
    async (input: string, init?: RequestInit) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const headers = new Headers(init?.headers || {})
      if (!(init?.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
      }
      headers.set('Authorization', `Bearer ${session.access_token}`)

      return fetch(input, {
        ...init,
        headers,
      })
    },
    [supabase],
  )

  // Carregar cursos
  React.useEffect(() => {
    const loadCursos = async () => {
      try {
        setLoadingCursos(true)
        const { data, error } = await supabase
          .from('cursos')
          .select('id, nome')
          .order('nome', { ascending: true })

        if (error) throw error
        setCursos(data || [])
      } catch (err) {
        console.error('Erro ao carregar cursos:', err)
      } finally {
        setLoadingCursos(false)
      }
    }

    loadCursos()
  }, [supabase])

  // Carregar disciplinas
  React.useEffect(() => {
    const loadDisciplinas = async () => {
      try {
        setLoadingDisciplinas(true)
        const { data, error } = await supabase
          .from('disciplinas')
          .select('id, nome')
          .order('nome', { ascending: true })

        if (error) throw error
        setDisciplinas(data || [])
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err)
      } finally {
        setLoadingDisciplinas(false)
      }
    }

    loadDisciplinas()
  }, [supabase])

  // Carregar frentes quando disciplina muda
  React.useEffect(() => {
    const loadFrentes = async () => {
      if (!disciplinaId) {
        setFrentes([])
        setFrenteId(undefined)
        setModulos([])
        setModuloId(undefined)
        return
      }

      try {
        setLoadingFrentes(true)
        const { data, error } = await supabase
          .from('frentes')
          .select('id, nome, disciplina_id')
          .eq('disciplina_id', disciplinaId)
          .order('nome', { ascending: true })

        if (error) throw error
        setFrentes(data || [])
        setFrenteId(undefined)
        setModulos([])
        setModuloId(undefined)
      } catch (err) {
        console.error('Erro ao carregar frentes:', err)
      } finally {
        setLoadingFrentes(false)
      }
    }

    loadFrentes()
  }, [supabase, disciplinaId])

  // Carregar módulos quando frente muda
  React.useEffect(() => {
    const loadModulos = async () => {
      if (!frenteId) {
        setModulos([])
        setModuloId(undefined)
        return
      }

      try {
        setLoadingModulos(true)
        const { data, error } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id')
          .eq('frente_id', frenteId)
          .order('numero_modulo', { ascending: true })

        if (error) throw error
        setModulos(data || [])
        setModuloId(undefined)
      } catch (err) {
        console.error('Erro ao carregar módulos:', err)
      } finally {
        setLoadingModulos(false)
      }
    }

    loadModulos()
  }, [supabase, frenteId])

  // Carregar flashcards
  const loadFlashcards = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (disciplinaId) params.append('disciplinaId', disciplinaId)
      if (frenteId) params.append('frenteId', frenteId)
      if (moduloId) params.append('moduloId', moduloId)
      if (search?.trim()) params.append('search', search.trim())
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      params.append('orderBy', 'created_at')
      params.append('orderDirection', 'desc')

      const res = await fetchWithAuth(`/api/flashcards?${params.toString()}`)
      const body = await res.json()

      if (!res.ok) {
        throw new Error(body?.error || 'Erro ao carregar flashcards')
      }

      setFlashcards(body.data || [])
      setTotal(body.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar flashcards')
    } finally {
      setLoading(false)
    }
  }, [fetchWithAuth, disciplinaId, frenteId, moduloId, search, page])

  React.useEffect(() => {
    loadFlashcards()
  }, [loadFlashcards])

  const handleCreate = async () => {
    if (!formModuloId || !formPergunta.trim() || !formResposta.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const res = await fetchWithAuth('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({
          moduloId: formModuloId,
          pergunta: formPergunta.trim(),
          resposta: formResposta.trim(),
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        throw new Error(body?.error || 'Erro ao criar flashcard')
      }

      setCreateDialogOpen(false)
      setFormModuloId(undefined)
      setFormPergunta('')
      setFormResposta('')
      loadFlashcards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar flashcard')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard)
    setFormPergunta(flashcard.pergunta)
    setFormResposta(flashcard.resposta)
    
    // Carregar disciplina e frente do flashcard
    const disciplinaIdFromFlashcard = flashcard.modulo.frente.disciplina.id
    const frenteIdFromFlashcard = flashcard.modulo.frente.id
    
    setDisciplinaId(disciplinaIdFromFlashcard)
    
    // Carregar frentes da disciplina
    try {
      const { data: frentesData, error: frentesError } = await supabase
        .from('frentes')
        .select('id, nome, disciplina_id')
        .eq('disciplina_id', disciplinaIdFromFlashcard)
        .order('nome', { ascending: true })

      if (!frentesError) {
        setFrentes(frentesData || [])
        setFrenteId(frenteIdFromFlashcard)
        
        // Carregar módulos da frente
        const { data: modulosData, error: modulosError } = await supabase
          .from('modulos')
          .select('id, nome, numero_modulo, frente_id')
          .eq('frente_id', frenteIdFromFlashcard)
          .order('numero_modulo', { ascending: true })

        if (!modulosError) {
          setModulos(modulosData || [])
          setFormModuloId(flashcard.modulo_id)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados para edição:', err)
    }
    
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedFlashcard || !formModuloId || !formPergunta.trim() || !formResposta.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const res = await fetchWithAuth(`/api/flashcards/${selectedFlashcard.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          moduloId: formModuloId,
          pergunta: formPergunta.trim(),
          resposta: formResposta.trim(),
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        throw new Error(body?.error || 'Erro ao atualizar flashcard')
      }

      setEditDialogOpen(false)
      setSelectedFlashcard(null)
      setFormModuloId(undefined)
      setFormPergunta('')
      setFormResposta('')
      loadFlashcards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar flashcard')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFlashcard) return

    try {
      setSaving(true)
      setError(null)

      const res = await fetchWithAuth(`/api/flashcards/${selectedFlashcard.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.error || 'Erro ao deletar flashcard')
      }

      setDeleteDialogOpen(false)
      setSelectedFlashcard(null)
      loadFlashcards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar flashcard')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenCreate = () => {
    setFormModuloId(undefined)
    setFormPergunta('')
    setFormResposta('')
    setCreateDialogOpen(true)
  }

  const handleOpenDelete = (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard)
    setDeleteDialogOpen(true)
  }

  const clearFilters = () => {
    setDisciplinaId(undefined)
    setFrenteId(undefined)
    setModuloId(undefined)
    setSearch('')
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Flashcards</h1>
          <p className="text-muted-foreground">
            Gerencie os flashcards do sistema. Total: {total}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Flashcard
        </Button>
      </div>

      {/* Upload de Flashcards */}
      <FlashcardUploadCard
        cursos={cursos}
        onUploadSuccess={() => {
          // Recarregar lista de flashcards após importação
          loadFlashcards()
        }}
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select 
                value={disciplinaId} 
                onValueChange={setDisciplinaId} 
                disabled={loadingDisciplinas}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frente</Label>
              <Select
                value={frenteId}
                onValueChange={setFrenteId}
                disabled={!disciplinaId || loadingFrentes}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {frentes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Módulo</Label>
              <Select
                value={moduloId}
                onValueChange={setModuloId}
                disabled={!frenteId || loadingModulos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.numero_modulo ? `Módulo ${m.numero_modulo}: ${m.nome}` : m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pergunta ou resposta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {(disciplinaId || frenteId || moduloId || search) && (
                  <Button variant="outline" size="icon" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : flashcards.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Search className="h-6 w-6" />
                </div>
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Nenhum flashcard encontrado</EmptyTitle>
                <EmptyDescription>
                  {disciplinaId || frenteId || moduloId || search
                    ? 'Tente ajustar os filtros ou criar um novo flashcard.'
                    : 'Comece criando seu primeiro flashcard.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pergunta</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Frente</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flashcards.map((flashcard) => (
                      <TableRow key={flashcard.id}>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={flashcard.pergunta}>
                            {flashcard.pergunta}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={flashcard.resposta}>
                            {flashcard.resposta}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {flashcard.modulo.frente.disciplina.nome}
                          </Badge>
                        </TableCell>
                        <TableCell>{flashcard.modulo.frente.nome}</TableCell>
                        <TableCell>
                          {flashcard.modulo.numero_modulo
                            ? `M${flashcard.modulo.numero_modulo}: ${flashcard.modulo.nome}`
                            : flashcard.modulo.nome}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(flashcard)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(flashcard)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Flashcard</DialogTitle>
            <DialogDescription>
              Preencha os campos para criar um novo flashcard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select
                value={disciplinaId}
                onValueChange={(v) => {
                  setDisciplinaId(v)
                  setFormModuloId(undefined)
                }}
                disabled={loadingDisciplinas}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frente *</Label>
              <Select
                value={frenteId}
                onValueChange={(v) => {
                  setFrenteId(v)
                  setFormModuloId(undefined)
                }}
                disabled={!disciplinaId || loadingFrentes}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma frente" />
                </SelectTrigger>
                <SelectContent>
                  {frentes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Módulo *</Label>
              <Select
                value={formModuloId}
                onValueChange={setFormModuloId}
                disabled={!frenteId || loadingModulos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.numero_modulo ? `Módulo ${m.numero_modulo}: ${m.nome}` : m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pergunta *</Label>
              <Textarea
                value={formPergunta}
                onChange={(e) => setFormPergunta(e.target.value)}
                placeholder="Digite a pergunta do flashcard..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Resposta *</Label>
              <Textarea
                value={formResposta}
                onChange={(e) => setFormResposta(e.target.value)}
                placeholder="Digite a resposta do flashcard..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Flashcard</DialogTitle>
            <DialogDescription>
              Atualize os campos do flashcard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select
                value={disciplinaId}
                onValueChange={(v) => {
                  setDisciplinaId(v)
                  setFormModuloId(undefined)
                }}
                disabled={loadingDisciplinas}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frente *</Label>
              <Select
                value={frenteId}
                onValueChange={(v) => {
                  setFrenteId(v)
                  setFormModuloId(undefined)
                }}
                disabled={!disciplinaId || loadingFrentes}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma frente" />
                </SelectTrigger>
                <SelectContent>
                  {frentes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Módulo *</Label>
              <Select
                value={formModuloId}
                onValueChange={setFormModuloId}
                disabled={!frenteId || loadingModulos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.numero_modulo ? `Módulo ${m.numero_modulo}: ${m.nome}` : m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pergunta *</Label>
              <Textarea
                value={formPergunta}
                onChange={(e) => setFormPergunta(e.target.value)}
                placeholder="Digite a pergunta do flashcard..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Resposta *</Label>
              <Textarea
                value={formResposta}
                onChange={(e) => setFormResposta(e.target.value)}
                placeholder="Digite a resposta do flashcard..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este flashcard? Esta ação não pode ser desfeita.
              {selectedFlashcard && (
                <div className="mt-2 rounded-md bg-muted p-2">
                  <p className="text-sm font-medium">Pergunta:</p>
                  <p className="text-sm">{selectedFlashcard.pergunta}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


