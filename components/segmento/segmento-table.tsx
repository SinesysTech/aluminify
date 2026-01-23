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
import { ArrowUpDown, Pencil, Trash2, Plus, Search } from 'lucide-react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Layers } from 'lucide-react'
import { apiClient, ApiClientError } from '@/lib/api-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export type Segmento = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

const segmentoSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
})

type SegmentoFormValues = z.infer<typeof segmentoSchema>

export function SegmentoTable() {
  const [data, setData] = React.useState<Segmento[]>([])
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
  const [editingSegmento, setEditingSegmento] = React.useState<Segmento | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingSegmento, setDeletingSegmento] = React.useState<Segmento | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const createForm = useForm<SegmentoFormValues>({
    resolver: zodResolver(segmentoSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  const editForm = useForm<SegmentoFormValues>({
    resolver: zodResolver(segmentoSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  const fetchSegmentos = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<{ data: Segmento[] }>('/api/segment')
      if (response && 'data' in response) {
        setData(response.data)
      } else {
        setError('Resposta inválida da API')
      }
    } catch (err) {
      let errorMessage = 'Erro ao carregar segmentos'
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
      console.error('Error fetching segmentos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSegmentos()
  }, [fetchSegmentos])

  const handleCreate = async (values: SegmentoFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.post<{ data: Segmento }>('/api/segment', values)
      setSuccessMessage('Segmento criado com sucesso!')
      setCreateDialogOpen(false)
      createForm.reset()
      await fetchSegmentos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMessage = 'Erro ao criar segmento'
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.'
        } else if (err.status === 403) {
          errorMessage = 'Acesso negado. Você precisa ser professor ou superadmin para criar segmentos.'
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

  const handleEdit = (segmento: Segmento) => {
    setEditingSegmento(segmento)
    editForm.reset({
      name: segmento.name,
      slug: segmento.slug,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (values: SegmentoFormValues) => {
    if (!editingSegmento) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.put<{ data: Segmento }>(`/api/segment/${editingSegmento.id}`, values)
      setSuccessMessage('Segmento atualizado com sucesso!')
      setEditDialogOpen(false)
      setEditingSegmento(null)
      editForm.reset()
      await fetchSegmentos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.data?.error || err.message
        : 'Erro ao atualizar segmento'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (segmento: Segmento) => {
    setDeletingSegmento(segmento)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingSegmento) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.delete(`/api/segment/${deletingSegmento.id}`)
      setSuccessMessage('Segmento excluído com sucesso!')
      setDeleteDialogOpen(false)
      setDeletingSegmento(null)
      await fetchSegmentos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.data?.error || err.message
        : 'Erro ao excluir segmento'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<Segmento>[] = [
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
      accessorKey: 'slug',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Slug
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue('slug')}</div>,
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
      header: 'Ações',
      enableHiding: false,
      cell: ({ row }) => {
        const segmento = row.original

        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEdit(segmento)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(segmento)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
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
    <TooltipProvider>
    <div className="flex flex-col gap-8 h-full pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
        <div>
          <h1 className="page-title">Segmentos</h1>
          <p className="page-subtitle">Gerencie os segmentos do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {mounted ? (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <button className="h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2">
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                  Novo Segmento
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Segmento</DialogTitle>
                  <DialogDescription>
                    Adicione um novo segmento ao sistema.
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
                            <Input placeholder="Ex: Ensino Fundamental" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome do segmento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: ensino-fundamental" {...field} />
                          </FormControl>
                          <FormDescription>
                            Identificador único (apenas letras minúsculas, números e hífens)
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
              Novo Segmento
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
        <TableSkeleton rows={5} columns={4} />
      ) : table.getRowModel().rows?.length ? (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {table.getRowModel().rows.map((row) => {
              const segmento = row.original
              return (
                <div key={row.id} className="rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{segmento.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {segmento.slug}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criado em {new Date(segmento.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(segmento)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(segmento)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
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
            <Layers className="w-8 h-8 text-zinc-400" strokeWidth={1} />
          </div>

          <h3 className="empty-state-title mb-2">Nenhum segmento cadastrado</h3>
          <p className="section-subtitle text-center max-w-sm mb-8 leading-relaxed">
            Sua infraestrutura está pronta. Adicione segmentos manualmente para organizar seus cursos.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="h-10 px-6 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
              Adicionar Segmento
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
      {mounted && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Segmento</DialogTitle>
              <DialogDescription>
                Atualize as informações do segmento.
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
                        <Input placeholder="Ex: Ensino Fundamental" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome do segmento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ensino-fundamental" {...field} />
                      </FormControl>
                      <FormDescription>
                        Identificador único (apenas letras minúsculas, números e hífens)
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
                Tem certeza que deseja excluir o segmento &quot;{deletingSegmento?.name}&quot;?
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
    </TooltipProvider>
  )
}

