'use client'

import * as React from 'react'
import { Plus, Users, Pencil, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TurmaDialog, type Turma } from './turma-dialog'
import { apiClient } from '@/lib/api-client'

interface TurmasListProps {
  cursoId: string
  cursoNome: string
}

interface TurmasResponse {
  data: Turma[]
}

export function TurmasList({ cursoId, cursoNome }: TurmasListProps) {
  const [turmas, setTurmas] = React.useState<Turma[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTurma, setEditingTurma] = React.useState<Turma | null>(null)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [turmaToDelete, setTurmaToDelete] = React.useState<Turma | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fetchTurmas = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<TurmasResponse>(`/api/turma?cursoId=${cursoId}`)
      setTurmas(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching turmas:', err)
      setError('Erro ao carregar turmas')
    } finally {
      setLoading(false)
    }
  }, [cursoId])

  React.useEffect(() => {
    fetchTurmas()
  }, [fetchTurmas])

  const handleCreate = () => {
    setEditingTurma(null)
    setDialogOpen(true)
  }

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma)
    setDialogOpen(true)
  }

  const handleDeleteClick = (turma: Turma) => {
    setTurmaToDelete(turma)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!turmaToDelete) return

    setDeleting(true)
    try {
      await apiClient.delete(`/api/turma/${turmaToDelete.id}`)
      setDeleteDialogOpen(false)
      setTurmaToDelete(null)
      fetchTurmas()
    } catch (err) {
      console.error('Error deleting turma:', err)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[#E4E4E7] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-zinc-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-zinc-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchTurmas}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-[#E4E4E7] bg-white">
        <div className="flex items-center justify-between p-4 border-b border-[#E4E4E7]">
          <div>
            <h3 className="text-base font-semibold">Turmas</h3>
            <p className="text-sm text-zinc-500">
              Gerencie as turmas do curso {cursoNome}
            </p>
          </div>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        </div>

        {turmas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-medium text-zinc-900">Nenhuma turma cadastrada</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Crie turmas para organizar seus alunos
            </p>
            <Button size="sm" className="mt-4" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira turma
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden p-4 space-y-3">
              {turmas.map((turma) => (
                <div key={turma.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{turma.nome}</h4>
                      <div className="flex items-center gap-1 text-sm text-zinc-600 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(turma.dataInicio)} - {formatDate(turma.dataFim)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={turma.ativo ? 'default' : 'secondary'}>
                      {turma.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-zinc-600">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span>{turma.alunosCount ?? 0} alunos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => handleEdit(turma)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar turma</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(turma)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir turma</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Nome</TableHead>
                    <TableHead className="font-medium">Período</TableHead>
                    <TableHead className="font-medium">Alunos</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turmas.map((turma) => (
                    <TableRow key={turma.id}>
                      <TableCell className="font-medium">{turma.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-zinc-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(turma.dataInicio)} - {formatDate(turma.dataFim)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-zinc-400" />
                          <span>{turma.alunosCount ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={turma.ativo ? 'default' : 'secondary'}>
                          {turma.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(turma)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar turma</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(turma)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir turma</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Create/Edit Dialog */}
        <TurmaDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          cursoId={cursoId}
          turma={editingTurma}
          onSuccess={fetchTurmas}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir turma</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a turma &quot;{turmaToDelete?.nome}&quot;?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
