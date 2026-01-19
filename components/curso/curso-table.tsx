'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Plus, BookOpen, Search } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
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
  DialogTrigger,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { apiClient, ApiClientError } from '@/lib/api-client'
import { format, parse } from 'date-fns'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import {
  DataPageContainer,
  DataPageHeader,
  DataPageFilters,
  DataPagePagination,
  DataPageEmptyState,
  DataPageTableWrapper,
  DataPageMobileCards,
  DataPagePrimaryButton,
} from '@/components/ui/data-page'

export type Curso = {
  id: string
  segmentId: string | null
  disciplineId: string | null // Mantido para compatibilidade
  disciplineIds?: string[] // Nova propriedade para múltiplas disciplinas
  name: string
  modality: 'EAD' | 'LIVE'
  type: 'Superextensivo' | 'Extensivo' | 'Intensivo' | 'Superintensivo' | 'Revisão'
  description: string | null
  year: number
  startDate: string | null
  endDate: string | null
  accessMonths: number | null
  planningUrl: string | null
  coverImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Segmento = {
  id: string
  name: string
  slug: string
}

export type Disciplina = {
  id: string
  name: string
}

const cursoSchema = z.object({
  segmentId: z.string().optional().nullable(),
  disciplineId: z.string().optional().nullable(), // Mantido para compatibilidade
  disciplineIds: z.array(z.string()).optional().default([]), // Nova propriedade para múltiplas disciplinas
  name: z.string().min(1, 'Nome é obrigatório'),
  modality: z.enum(['EAD', 'LIVE'], { message: 'Modalidade é obrigatória' }),
  type: z.enum(['Superextensivo', 'Extensivo', 'Intensivo', 'Superintensivo', 'Revisão'], {
    message: 'Tipo é obrigatório',
  }),
  description: z.string().optional().nullable(),
  year: z.coerce.number().min(2020, 'Ano inválido').max(2100, 'Ano inválido'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  accessMonths: z.coerce.number().optional().nullable(),
  planningUrl: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  coverImageUrl: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
})

type CursoFormValues = z.infer<typeof cursoSchema>

export function CursoTable() {
  const [data, setData] = React.useState<Curso[]>([])
  const [segmentos, setSegmentos] = React.useState<Segmento[]>([])
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [mounted, setMounted] = React.useState(false)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingCurso, setEditingCurso] = React.useState<Curso | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingCurso, setDeletingCurso] = React.useState<Curso | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const createForm = useForm<CursoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(cursoSchema) as any,
    defaultValues: {
      segmentId: null,
      disciplineId: null,
      disciplineIds: [],
      name: '',
      modality: 'EAD',
      type: 'Extensivo',
      description: null,
      year: new Date().getFullYear(),
      startDate: null,
      endDate: null,
      accessMonths: null,
      planningUrl: null,
      coverImageUrl: null,
    },
  })

  const editForm = useForm<CursoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(cursoSchema) as any,
    defaultValues: {
      segmentId: null,
      disciplineId: null,
      disciplineIds: [],
      name: '',
      modality: 'EAD',
      type: 'Extensivo',
      description: null,
      year: new Date().getFullYear(),
      startDate: null,
      endDate: null,
      accessMonths: null,
      planningUrl: null,
      coverImageUrl: null,
    },
  })

  const fetchSegmentos = React.useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: Segmento[] }>('/api/segment')
      if (response && 'data' in response) {
        setSegmentos(response.data)
      }
    } catch (err) {
      console.error('Error fetching segmentos:', err)
    }
  }, [])

  const fetchDisciplinas = React.useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: Disciplina[] }>('/api/discipline')
      if (response && 'data' in response) {
        setDisciplinas(response.data)
      }
    } catch (err) {
      console.error('Error fetching disciplinas:', err)
    }
  }, [])

  const fetchCursos = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<{ data: Curso[] }>('/api/course')
      if (response && 'data' in response) {
        setData(response.data)
      } else {
        setError('Resposta inválida da API')
      }
    } catch (err) {
      let errorMessage = 'Erro ao carregar cursos'
      if (err instanceof ApiClientError) {
        if (err.status === 500) {
          errorMessage = `Erro interno do servidor: ${err.data?.error || 'Erro desconhecido'}`
        } else if (err.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.'
        } else if (err.status === 403) {
          errorMessage = 'Acesso negado.'
        } else {
          errorMessage = err.data?.error || err.message || errorMessage
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error('Error fetching cursos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCursos()
    fetchSegmentos()
    fetchDisciplinas()
  }, [fetchCursos, fetchSegmentos, fetchDisciplinas])

  const handleCreate = async (values: CursoFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.post<{ data: Curso }>('/api/course', {
        ...values,
        segmentId: values.segmentId || undefined,
        disciplineId: values.disciplineId || undefined, // Mantido para compatibilidade
        disciplineIds: values.disciplineIds || [], // Sempre enviar array, mesmo se vazio
        planningUrl: values.planningUrl || undefined,
        coverImageUrl: values.coverImageUrl || undefined,
      })
      setSuccessMessage('Curso criado com sucesso!')
      setCreateDialogOpen(false)
      createForm.reset()
      await fetchCursos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMessage = 'Erro ao criar curso'
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.'
        } else if (err.status === 403) {
          errorMessage = 'Acesso negado. Você precisa ser professor ou superadmin.'
        } else if (err.status === 500) {
          errorMessage = `Erro interno do servidor: ${err.data?.error || err.message || 'Erro desconhecido'}`
        } else {
          errorMessage = err.data?.error || err.message || errorMessage
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso)
    editForm.reset({
      segmentId: curso.segmentId,
      disciplineId: curso.disciplineId, // Mantido para compatibilidade
      disciplineIds: curso.disciplineIds || (curso.disciplineId ? [curso.disciplineId] : []),
      name: curso.name,
      modality: curso.modality,
      type: curso.type,
      description: curso.description,
      year: curso.year,
      startDate: curso.startDate,
      endDate: curso.endDate,
      accessMonths: curso.accessMonths,
      planningUrl: curso.planningUrl,
      coverImageUrl: curso.coverImageUrl,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (values: CursoFormValues) => {
    if (!editingCurso) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.put<{ data: Curso }>(`/api/course/${editingCurso.id}`, {
        ...values,
        segmentId: values.segmentId || null,
        disciplineId: values.disciplineId || null, // Mantido para compatibilidade
        disciplineIds: values.disciplineIds || [], // Sempre enviar array, mesmo se vazio
        planningUrl: values.planningUrl || null,
        coverImageUrl: values.coverImageUrl || null,
      })
      setSuccessMessage('Curso atualizado com sucesso!')
      setEditDialogOpen(false)
      setEditingCurso(null)
      editForm.reset()
      await fetchCursos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.data?.error || err.message
        : 'Erro ao atualizar curso'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (curso: Curso) => {
    setDeletingCurso(curso)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingCurso) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.delete(`/api/course/${deletingCurso.id}`)
      setSuccessMessage('Curso excluído com sucesso!')
      setDeleteDialogOpen(false)
      setDeletingCurso(null)
      await fetchCursos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.data?.error || err.message
        : 'Erro ao excluir curso'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<Curso>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'modality',
      header: 'Modalidade',
      cell: ({ row }) => <div>{row.getValue('modality')}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <div>{row.getValue('type')}</div>,
    },
    {
      accessorKey: 'year',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Ano
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue('year')}</div>,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Criado em
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return <div>{date.toLocaleDateString('pt-BR')}</div>
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const curso = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(curso)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(curso)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="flex flex-col gap-8 h-full pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
        <div>
          <h1 className="page-title">Cursos</h1>
          <p className="page-subtitle">Gerencie os cursos do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {mounted ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <button className="h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2">
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                  Novo Curso
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Criar Curso</DialogTitle>
                  <DialogDescription>
                    Adicione um novo curso ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Matemática Básica" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2024" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <FormField
                        control={createForm.control}
                        name="modality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modalidade *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a modalidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="EAD">EAD</SelectItem>
                                <SelectItem value="LIVE">LIVE</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Superextensivo">Superextensivo</SelectItem>
                                <SelectItem value="Extensivo">Extensivo</SelectItem>
                                <SelectItem value="Intensivo">Intensivo</SelectItem>
                                <SelectItem value="Superintensivo">Superintensivo</SelectItem>
                                <SelectItem value="Revisão">Revisão</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="accessMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meses de Acesso</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="12"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <FormField
                        control={createForm.control}
                        name="segmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segmento</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                              value={field.value || '__none__'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o segmento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="__none__">Nenhum</SelectItem>
                                {segmentos.map((segmento) => (
                                  <SelectItem key={segmento.id} value={segmento.id}>
                                    {segmento.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="disciplineIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disciplinas</FormLabel>
                            <div className="space-y-2">
                              <FormDescription>
                                Selecione uma ou mais disciplinas para este curso
                              </FormDescription>
                              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-4">
                                {disciplinas.map((disciplina) => (
                                  <div key={disciplina.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(disciplina.id) || false}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || []
                                        if (checked) {
                                          field.onChange([...currentValue, disciplina.id])
                                        } else {
                                          field.onChange(currentValue.filter((id) => id !== disciplina.id))
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`discipline-${disciplina.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {disciplina.name}
                                    </label>
                                  </div>
                                ))}
                                {disciplinas.length === 0 && (
                                  <p className="text-sm text-muted-foreground col-span-2">
                                    Nenhuma disciplina cadastrada
                                  </p>
                                )}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição do curso..."
                              {...field}
                              value={field.value || ''}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <FormField
                        control={createForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Início</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                                placeholder="dd/mm/yyyy"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Término</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                                placeholder="dd/mm/yyyy"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="planningUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Planejamento</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://..."
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={createForm.control}
                      name="coverImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Imagem de Capa</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://..."
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando...' : 'Criar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
              Novo Curso
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Filtrar por nome..."
            className="w-full h-10 pl-9 pr-4 rounded-md border border-[#E4E4E7] bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all"
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : table.getRowModel().rows?.length ? (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {table.getRowModel().rows.map((row) => {
              const curso = row.original
              return (
                <div key={row.id} className="rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{curso.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">{curso.modality}</Badge>
                          <Badge variant="outline" className="text-xs">{curso.type}</Badge>
                          <Badge variant="outline" className="text-xs">{curso.year}</Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(curso)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(curso)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {curso.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{curso.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden flex-1">
            <Table className="w-full text-left text-sm">
              <TableHeader className="border-b border-[#E4E4E7]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="h-10 px-4 font-mono text-xs font-medium text-[#71717A] uppercase tracking-wider">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-[#E4E4E7]">
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="group hover:bg-zinc-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <section id="empty-state" className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-[#E4E4E7]">
            <BookOpen className="w-8 h-8 text-zinc-400" strokeWidth={1} />
          </div>

          <h3 className="empty-state-title mb-2">Nenhum curso cadastrado</h3>
          <p className="section-subtitle text-center max-w-sm mb-8 leading-relaxed">
            Sua infraestrutura está pronta. Adicione cursos manualmente para começar a organizar seu conteúdo.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="h-10 px-6 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
              Adicionar Curso
            </button>
          </div>
        </section>
      )}

      {table.getRowModel().rows?.length > 0 && (
        <div className="border-t border-[#E4E4E7] px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-[#71717A]">
            Mostrando <strong>{table.getFilteredRowModel().rows.length}</strong> resultados
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {mounted && editingCurso && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Editar Curso</DialogTitle>
              <DialogDescription>
                Atualize as informações do curso.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Matemática Básica" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField
                    control={editForm.control}
                    name="modality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a modalidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EAD">EAD</SelectItem>
                            <SelectItem value="LIVE">LIVE</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Superextensivo">Superextensivo</SelectItem>
                            <SelectItem value="Extensivo">Extensivo</SelectItem>
                            <SelectItem value="Intensivo">Intensivo</SelectItem>
                            <SelectItem value="Superintensivo">Superintensivo</SelectItem>
                            <SelectItem value="Revisão">Revisão</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="accessMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meses de Acesso</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="segmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segmento</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o segmento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
                            {segmentos.map((segmento) => (
                              <SelectItem key={segmento.id} value={segmento.id}>
                                {segmento.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="disciplineIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplinas</FormLabel>
                        <div className="space-y-2">
                          <FormDescription>
                            Selecione uma ou mais disciplinas para este curso
                          </FormDescription>
                          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-4">
                            {disciplinas.map((disciplina) => (
                              <div key={disciplina.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(disciplina.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || []
                                    if (checked) {
                                      field.onChange([...currentValue, disciplina.id])
                                    } else {
                                      field.onChange(currentValue.filter((id) => id !== disciplina.id))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`edit-discipline-${disciplina.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {disciplina.name}
                                </label>
                              </div>
                            ))}
                            {disciplinas.length === 0 && (
                              <p className="text-sm text-muted-foreground col-span-2">
                                Nenhuma disciplina cadastrada
                              </p>
                            )}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do curso..."
                          {...field}
                          value={field.value || ''}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField
                    control={editForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                            placeholder="dd/mm/yyyy"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                            placeholder="dd/mm/yyyy"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="planningUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Planejamento</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem de Capa</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Atualizando...' : 'Atualizar'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Alert Dialog */}
      {mounted && deletingCurso && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o curso &quot;{deletingCurso.name}&quot;?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

