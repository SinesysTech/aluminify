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
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Plus, Search } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { FileText } from 'lucide-react'
import { apiClient, ApiClientError } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'

export type Disciplina = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

const disciplinaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

type DisciplinaFormValues = z.infer<typeof disciplinaSchema>

export function DisciplinaTable() {
  const [data, setData] = React.useState<Disciplina[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [mounted, setMounted] = React.useState(false)
  const [filterValue, setFilterValue] = React.useState('')
  const filterTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingDisciplina, setEditingDisciplina] = React.useState<Disciplina | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingDisciplina, setDeletingDisciplina] = React.useState<Disciplina | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const createForm = useForm<DisciplinaFormValues>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      name: '',
    },
  })

  const editForm = useForm<DisciplinaFormValues>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      name: '',
    },
  })

  const fetchDisciplinas = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const startTime = performance.now()
      const response = await apiClient.get<{ data: Disciplina[] }>('/api/discipline')
      const endTime = performance.now()

      if (endTime - startTime > 1000) {
        console.warn(`[DisciplinaTable] Carregamento lento: ${Math.round(endTime - startTime)}ms`)
      }

      if (response && 'data' in response) {
        setData(response.data)
      } else {
        setError('Resposta inválida da API')
      }
    } catch (err) {
      let errorMessage = 'Erro ao carregar disciplinas'
      if (err instanceof ApiClientError) {
        if (err.status === 500) {
          const details = err.data?.details
          errorMessage = `Erro interno do servidor: ${err.data?.error || 'Erro desconhecido'}`
          if (details) {
            console.error('Error details:', details)
          }
        } else if (err.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.'
        } else if (err.status === 403) {
          errorMessage = 'Acesso negado. Você não tem permissão para acessar este recurso.'
        } else {
          errorMessage = err.data?.error || err.message || errorMessage
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error('Error fetching disciplinas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDisciplinas()
  }, [fetchDisciplinas])

  const handleCreate = async (values: DisciplinaFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.post<{ data: Disciplina }>('/api/discipline', values)
      setSuccessMessage('Disciplina criada com sucesso!')
      setCreateDialogOpen(false)
      createForm.reset()
      await fetchDisciplinas()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMessage = 'Erro ao criar disciplina'
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.'
        } else if (err.status === 403) {
          errorMessage = 'Acesso negado. Você precisa ser professor ou superadmin para criar disciplinas.'
        } else if (err.status === 500) {
          const details = err.data?.details
          errorMessage = `Erro interno do servidor: ${err.data?.error || err.message || 'Erro desconhecido'}`
          if (details) {
            console.error('Error details:', details)
          }
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

  const handleEdit = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina)
    editForm.reset({
      name: disciplina.name,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (values: DisciplinaFormValues) => {
    if (!editingDisciplina) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.put<{ data: Disciplina }>(`/api/discipline/${editingDisciplina.id}`, values)
      setSuccessMessage('Disciplina atualizada com sucesso!')
      setEditDialogOpen(false)
      setEditingDisciplina(null)
      editForm.reset()
      await fetchDisciplinas()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.data?.error || err.message
        : 'Erro ao atualizar disciplina'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (disciplina: Disciplina) => {
    setDeletingDisciplina(disciplina)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingDisciplina) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.delete(`/api/discipline/${deletingDisciplina.id}`)
      setSuccessMessage('Disciplina excluída com sucesso!')
      setDeleteDialogOpen(false)
      setDeletingDisciplina(null)
      await fetchDisciplinas()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.data?.error || err.message
        : 'Erro ao excluir disciplina'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<Disciplina>[] = [
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
        const disciplina = row.original

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
              <DropdownMenuItem onClick={() => handleEdit(disciplina)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(disciplina)}
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

  // Debounce filter
  React.useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current)
    }

    filterTimeoutRef.current = setTimeout(() => {
      table.getColumn('name')?.setFilterValue(filterValue)
    }, 300)

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current)
      }
    }
  }, [filterValue, table])

  return (
    <div className="flex flex-col gap-(--space-page-gap) h-full pb-(--space-page-pb)">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-(--space-section-gap) border-b border-[#E4E4E7] pb-(--space-section-gap)">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Disciplinas</h1>
          <p className="text-sm text-[#71717A]">Gerencie as disciplinas do sistema</p>
        </div>
        <div className="flex items-center gap-(--space-button-gap)">
          {mounted ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <button className="h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2">
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                  Nova Disciplina
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Disciplina</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova disciplina ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Matemática" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome da disciplina
                          </FormDescription>
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
              Nova Disciplina
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

      <div className="flex flex-col sm:flex-row gap-(--space-filter-gap)">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Filtrar por nome..."
            className="w-full h-10 pl-9 pr-4 rounded-md border border-[#E4E4E7] bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-[#E4E4E7] bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : table.getRowModel().rows?.length ? (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {table.getRowModel().rows.map((row) => {
              const disciplina = row.original
              return (
                <div key={row.id} className="rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{disciplina.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Criado em {new Date(disciplina.createdAt).toLocaleDateString('pt-BR')}
                        </p>
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
                          <DropdownMenuItem onClick={() => handleEdit(disciplina)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(disciplina)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden flex-1 rounded-lg border border-[#E4E4E7] bg-white shadow-sm">
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
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Nenhuma disciplina encontrada</EmptyTitle>
            <EmptyDescription>
              Você ainda não criou nenhuma disciplina. Comece criando sua primeira disciplina.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Disciplina
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <div className="border-t border-[#E4E4E7] px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-[#71717A]">
          Mostrando <strong>{table.getFilteredRowModel().rows.length}</strong> resultados
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 h-auto"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 h-auto"
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      {mounted && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Disciplina</DialogTitle>
              <DialogDescription>
                Atualize as informações da disciplina.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Matemática" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome da disciplina
                      </FormDescription>
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
      {mounted && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a disciplina &quot;{deletingDisciplina?.name}&quot;?
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

