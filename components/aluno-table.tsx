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
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Plus, Users, UploadCloud, FileDown } from 'lucide-react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiClient, ApiClientError } from '@/lib/api-client'

export type CourseOption = {
  id: string
  name: string
}

export type Aluno = {
  id: string
  fullName: string | null
  email: string
  cpf: string | null
  phone: string | null
  birthDate: string | null
  address: string | null
  zipCode: string | null
  enrollmentNumber: string | null
  instagram: string | null
  twitter: string | null
  courses: CourseOption[]
  mustChangePassword: boolean
  temporaryPassword: string | null
  createdAt: string
  updatedAt: string
}


type StudentImportApiSummary = {
  total: number
  created: number
  skipped: number
  failed: number
  rows: {
    rowNumber: number
    email: string
    status: 'created' | 'skipped' | 'failed'
    message?: string
  }[]
}

const STUDENT_IMPORT_TEMPLATE = [
  ['Nome Completo', 'Email', 'CPF', 'Telefone', 'Número de Matrícula', 'Cursos', 'Senha Temporária'],
  ['Maria Souza', 'maria@example.com', '12345678901', '11999990000', 'MAT-0001', 'Curso A; Curso B', 'Senha@123'],
] as const

const STUDENT_IMPORT_FILE_ACCEPT = '.csv,.xlsx,.xls'

const alunoSchema = z.object({
  fullName: z.string().optional().nullable(),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  cpf: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  enrollmentNumber: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  courseIds: z.array(z.string()).min(1, 'Selecione pelo menos um curso'),
  temporaryPassword: z.string().min(8, 'A senha temporária deve ter pelo menos 8 caracteres'),
})

type AlunoFormValues = z.infer<typeof alunoSchema>


export function AlunoTable() {
  const [data, setData] = React.useState<Aluno[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [mounted, setMounted] = React.useState(false)
  const [courseOptions, setCourseOptions] = React.useState<CourseOption[]>([])
  const [coursesLoading, setCoursesLoading] = React.useState(false)
  const [createPasswordTouched, setCreatePasswordTouched] = React.useState(false)
  const [editPasswordTouched, setEditPasswordTouched] = React.useState(false)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingAluno, setEditingAluno] = React.useState<Aluno | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingAluno, setDeletingAluno] = React.useState<Aluno | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [importErrors, setImportErrors] = React.useState<string[]>([])
  const [importSummary, setImportSummary] = React.useState<StudentImportApiSummary | null>(null)
  const [importLoading, setImportLoading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true)
        const response = await apiClient.get<{ data: { id: string; name: string }[] }>('/api/course')
        if (response && 'data' in response) {
          setCourseOptions(response.data.map((course) => ({ id: course.id, name: course.name })))
        }
      } catch (err) {
        console.error('Erro ao carregar cursos:', err)
        setError('Erro ao carregar lista de cursos')
      } finally {
        setCoursesLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const createForm = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      fullName: null,
      email: '',
      cpf: null,
      phone: null,
      birthDate: null,
      address: null,
      zipCode: null,
      enrollmentNumber: null,
      instagram: null,
      twitter: null,
      courseIds: [],
      temporaryPassword: '',
    },
  })

  const createCpfValue = createForm.watch('cpf')
  const createCourseIds = createForm.watch('courseIds')

  const editForm = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      fullName: null,
      email: '',
      cpf: null,
      phone: null,
      birthDate: null,
      address: null,
      zipCode: null,
      enrollmentNumber: null,
      instagram: null,
      twitter: null,
      courseIds: [],
      temporaryPassword: '',
    },
  })

  const editCpfValue = editForm.watch('cpf')
  const editCourseIds = editForm.watch('courseIds')

  React.useEffect(() => {
    if (createPasswordTouched) {
      return
    }
    const cpfDigits = (createCpfValue || '').replace(/\D/g, '')
    const primaryCourseName = courseOptions.find((course) => course.id === createCourseIds?.[0])?.name

    if (cpfDigits && primaryCourseName) {
      createForm.setValue('temporaryPassword', generateDefaultPassword(cpfDigits, primaryCourseName))
    }
  }, [createCpfValue, createCourseIds, courseOptions, createPasswordTouched, createForm])

  const handleGenerateCreatePassword = React.useCallback(() => {
    const cpfDigits = (createCpfValue || '').replace(/\D/g, '')
    const primaryCourseName = courseOptions.find((course) => course.id === createCourseIds?.[0])?.name

    if (!cpfDigits || !primaryCourseName) {
      setError('Informe o CPF e selecione pelo menos um curso para gerar a senha padrão.')
      setTimeout(() => setError(null), 4000)
      return
    }

    createForm.setValue('temporaryPassword', generateDefaultPassword(cpfDigits, primaryCourseName))
    setCreatePasswordTouched(true)
  }, [createCpfValue, createCourseIds, courseOptions, createForm])

  const handleGenerateEditPassword = React.useCallback(() => {
    const cpfDigits = (editCpfValue || '').replace(/\D/g, '')
    const primaryCourseName = courseOptions.find((course) => course.id === editCourseIds?.[0])?.name

    if (!cpfDigits || !primaryCourseName) {
      setError('Informe o CPF e selecione pelo menos um curso para gerar a senha padrão.')
      setTimeout(() => setError(null), 4000)
      return
    }

    editForm.setValue('temporaryPassword', generateDefaultPassword(cpfDigits, primaryCourseName))
    setEditPasswordTouched(true)
  }, [courseOptions, editCpfValue, editCourseIds, editForm])

  const fetchAlunos = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<{ data: Aluno[] }>('/api/student')
      if (response && 'data' in response) {
        setData(response.data)
      } else {
        setError('Resposta inválida da API')
      }
    } catch (err) {
      let errorMessage = 'Erro ao carregar alunos'
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
      console.error('Error fetching alunos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAlunos()
  }, [fetchAlunos])

  const resetImportState = React.useCallback(() => {
    setImportErrors([])
    setImportSummary(null)
    setImportLoading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleImportDialogChange = (open: boolean) => {
    setImportDialogOpen(open)
    if (!open) {
      resetImportState()
    }
  }

  const handleDownloadTemplate = () => {
    const csv = STUDENT_IMPORT_TEMPLATE.map((row) => row.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo-importacao-alunos.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImportSummary(null)
    setImportErrors([])

    if (!file) {
      return
    }

    const extension = file.name.toLowerCase()
    if (!extension.endsWith('.csv') && !extension.endsWith('.xlsx') && !extension.endsWith('.xls')) {
      setImportErrors(['Selecione um arquivo CSV ou XLSX.'])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
  }

  const handleSubmitImport = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setImportErrors(['Selecione um arquivo para importação.'])
      return
    }

    try {
      setImportLoading(true)
      setImportErrors([])
      setImportSummary(null)

      const formData = new FormData()
      formData.append('file', file)

      // Usar fetch diretamente para FormData
      const { createClient } = await import('@/lib/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/student/bulk-import', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new ApiClientError(
          errorData.error || `Erro ${response.status}`,
          response.status,
          errorData
        )
      }

      const result = await response.json()
      setImportSummary(result.data)
      setSuccessMessage('Importação de alunos concluída!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await fetchAlunos()
    } catch (err) {
      let errorMessage = 'Erro ao importar alunos'
      if (err instanceof ApiClientError) {
        errorMessage = err.data?.error || err.message || errorMessage
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setImportErrors([errorMessage])
    } finally {
      setImportLoading(false)
    }
  }

  const handleCreate = async (values: AlunoFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.post<{ data: Aluno }>('/api/student', {
        ...values,
        fullName: values.fullName || undefined,
        cpf: values.cpf || undefined,
        phone: values.phone || undefined,
        birthDate: values.birthDate || undefined,
        address: values.address || undefined,
        zipCode: values.zipCode || undefined,
        enrollmentNumber: values.enrollmentNumber || undefined,
        instagram: values.instagram || undefined,
        twitter: values.twitter || undefined,
      })
      setSuccessMessage('Aluno criado com sucesso!')
      setCreateDialogOpen(false)
      createForm.reset({
        fullName: null,
        email: '',
        cpf: null,
        phone: null,
        birthDate: null,
        address: null,
        zipCode: null,
        enrollmentNumber: null,
        instagram: null,
        twitter: null,
        courseIds: [],
        temporaryPassword: '',
      })
      setCreatePasswordTouched(false)
      await fetchAlunos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMessage = 'Erro ao criar aluno'
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.'
        } else if (err.status === 403) {
          errorMessage = 'Acesso negado.'
        } else if (err.status === 500) {
          // Verificar se é erro de email duplicado
          const errorText = err.data?.error || err.message || ''
          if (errorText.includes('email address has already been registered') || 
              errorText.includes('email já está registrado') ||
              errorText.includes('email já cadastrado') ||
              errorText.includes('already been registered')) {
            errorMessage = 'Este email já está cadastrado no sistema. Por favor, use outro email.'
          } else {
            errorMessage = `Erro interno do servidor: ${errorText || 'Erro desconhecido'}`
          }
        } else if (err.status === 409) {
          // Status 409 (Conflict) geralmente indica conflito de dados
          errorMessage = err.data?.error || 'Este email já está cadastrado no sistema. Por favor, use outro email.'
        } else {
          errorMessage = err.data?.error || err.message || errorMessage
        }
      } else if (err instanceof Error) {
        // Verificar se a mensagem de erro contém informação sobre email duplicado
        if (err.message.includes('email address has already been registered') || 
            err.message.includes('email já está registrado') ||
            err.message.includes('email já cadastrado') ||
            err.message.includes('already been registered')) {
          errorMessage = 'Este email já está cadastrado no sistema. Por favor, use outro email.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno)
    editForm.reset({
      fullName: aluno.fullName,
      email: aluno.email,
      cpf: aluno.cpf,
      phone: aluno.phone,
      birthDate: aluno.birthDate,
      address: aluno.address,
      zipCode: aluno.zipCode,
      enrollmentNumber: aluno.enrollmentNumber,
      instagram: aluno.instagram,
      twitter: aluno.twitter,
      courseIds: aluno.courses.map((course) => course.id),
      temporaryPassword: aluno.temporaryPassword || '',
    })
    setEditPasswordTouched(false)
    setEditDialogOpen(true)
  }

  const handleUpdate = async (values: AlunoFormValues) => {
    if (!editingAluno) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.put<{ data: Aluno }>(`/api/student/${editingAluno.id}`, {
        ...values,
        fullName: values.fullName || null,
        cpf: values.cpf || null,
        phone: values.phone || null,
        birthDate: values.birthDate || null,
        address: values.address || null,
        zipCode: values.zipCode || null,
        enrollmentNumber: values.enrollmentNumber || null,
        instagram: values.instagram || null,
        twitter: values.twitter || null,
        courseIds: values.courseIds,
        temporaryPassword: editPasswordTouched ? values.temporaryPassword : undefined,
      })
      setSuccessMessage('Aluno atualizado com sucesso!')
      setEditDialogOpen(false)
      setEditingAluno(null)
      editForm.reset({
        fullName: null,
        email: '',
        cpf: null,
        phone: null,
        birthDate: null,
        address: null,
        zipCode: null,
        enrollmentNumber: null,
        instagram: null,
        twitter: null,
        courseIds: [],
        temporaryPassword: '',
      })
      setEditPasswordTouched(false)
      await fetchAlunos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError 
        ? err.data?.error || err.message 
        : 'Erro ao atualizar aluno'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (aluno: Aluno) => {
    setDeletingAluno(aluno)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingAluno) return

    try {
      setIsSubmitting(true)
      setError(null)
      await apiClient.delete(`/api/student/${deletingAluno.id}`)
      setSuccessMessage('Aluno excluído com sucesso!')
      setDeleteDialogOpen(false)
      setDeletingAluno(null)
      await fetchAlunos()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = err instanceof ApiClientError 
        ? err.data?.error || err.message 
        : 'Erro ao excluir aluno'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<Aluno>[] = [
    {
      accessorKey: 'fullName',
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
      cell: ({ row }) => <div className="font-medium">{row.getValue('fullName') || '-'}</div>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ row }) => <div>{row.getValue('cpf') || '-'}</div>,
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
    },
    {
      accessorKey: 'enrollmentNumber',
      header: 'Matrícula',
      cell: ({ row }) => <div>{row.getValue('enrollmentNumber') || '-'}</div>,
    },
    {
      id: 'courses',
      header: 'Cursos',
      cell: ({ row }) => {
        const courses = row.original.courses
        if (!courses.length) {
          return <span className="text-muted-foreground text-sm">-</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {courses.map((course) => (
              <Badge key={course.id} variant="outline">
                {course.name}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'temporaryPassword',
      header: 'Senha temporária',
      cell: ({ row }) =>
        row.original.temporaryPassword ? (
          <code className="rounded bg-muted px-2 py-1 text-xs">{row.original.temporaryPassword}</code>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      accessorKey: 'mustChangePassword',
      header: 'Troca obrigatória',
      cell: ({ row }) =>
        row.original.mustChangePassword ? (
          <Badge variant="secondary">Sim</Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
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
        const aluno = row.original

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
              <DropdownMenuItem onClick={() => handleEdit(aluno)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(aluno)}
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
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Alunos</CardTitle>
              <CardDescription>Gerencie os alunos do sistema</CardDescription>
            </div>
            {mounted ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Aluno
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Criar Aluno</DialogTitle>
                      <DialogDescription>
                        Adicione um novo aluno ao sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField
                          control={createForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="João Silva" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="joao@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <FormField
                          control={createForm.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000-00" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value ? (() => {
                                    // Converter string YYYY-MM-DD para Date sem problemas de timezone
                                    const [year, month, day] = field.value.split('-').map(Number)
                                    return new Date(year, month - 1, day)
                                  })() : null}
                                  onChange={(date) => {
                                    if (date) {
                                      // Converter Date para string YYYY-MM-DD sem problemas de timezone
                                      const year = date.getFullYear()
                                      const month = String(date.getMonth() + 1).padStart(2, '0')
                                      const day = String(date.getDate()).padStart(2, '0')
                                      field.onChange(`${year}-${month}-${day}`)
                                    } else {
                                      field.onChange(null)
                                    }
                                  }}
                                  placeholder="dd/mm/yyyy"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <FormField
                          control={createForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input placeholder="Rua, número, bairro" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-000" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <FormField
                          control={createForm.control}
                          name="enrollmentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Matrícula</FormLabel>
                              <FormControl>
                                <Input placeholder="12345" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram</FormLabel>
                              <FormControl>
                                <Input placeholder="@usuario" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter</FormLabel>
                              <FormControl>
                                <Input placeholder="@usuario" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="courseIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cursos *</FormLabel>
                            <div className="space-y-2 rounded-md border p-3">
                              {coursesLoading ? (
                                <p className="text-sm text-muted-foreground">Carregando cursos...</p>
                              ) : courseOptions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Nenhum curso disponível. Cadastre um curso antes de adicionar alunos.
                                </p>
                              ) : (
                                courseOptions.map((course) => {
                                  const selected = field.value?.includes(course.id)
                                  return (
                                    <label key={course.id} className="flex items-center gap-2 text-sm">
                                      <Checkbox
                                        checked={selected}
                                        onCheckedChange={(checked) => {
                                          const current = field.value ?? []
                                          if (checked) {
                                            field.onChange([...current, course.id])
                                          } else {
                                            field.onChange(current.filter((id) => id !== course.id))
                                          }
                                          setCreatePasswordTouched(false)
                                        }}
                                      />
                                      {course.name}
                                    </label>
                                  )
                                })
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="temporaryPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Temporária *</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input
                            placeholder="Senha provisória do aluno"
                            {...field}
                            value={field.value || ''}
                            onChange={(event) => {
                              setCreatePasswordTouched(true)
                              field.onChange(event.target.value)
                            }}
                          />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleGenerateCreatePassword} className="w-full sm:w-auto">
                          Gerar
                        </Button>
                      </div>
                            <p className="text-xs text-muted-foreground">
                              Esta senha será exibida ao professor e o aluno precisará alterá-la no primeiro acesso.
                            </p>
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
                <Dialog open={importDialogOpen} onOpenChange={handleImportDialogChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Importar planilha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-5xl">
                    <DialogHeader>
                      <DialogTitle>Importar alunos via planilha</DialogTitle>
                      <DialogDescription>
                        Faça upload do modelo preenchido com os campos obrigatórios.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-2">
                        <p>Campos obrigatórios: Nome completo, Email, CPF, Telefone, Número de matrícula, Cursos e Senha temporária.</p>
                        <p>Os nomes dos cursos devem ser exatamente os mesmos cadastrados na plataforma.</p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs">Use o modelo base para evitar erros de formatação.</span>
                          <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Baixar modelo (.csv)
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione o arquivo</label>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept={STUDENT_IMPORT_FILE_ACCEPT}
                          onChange={handleImportFileChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Formatos aceitos: CSV, XLS ou XLSX. Separe múltiplos cursos com ponto e vírgula (;).
                        </p>
                      </div>
                      {importErrors.length > 0 && (
                        <div className="space-y-1 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                          {importErrors.map((err) => (
                            <p key={err}>{err}</p>
                          ))}
                        </div>
                      )}
                      {importSummary && (
                        <div className="rounded-md border p-3 text-sm">
                          <p className="font-medium">Resumo da importação</p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs sm:text-sm">
                            <span>Processados: {importSummary.total}</span>
                            <span className="text-green-600 dark:text-green-400">
                              Criados: {importSummary.created}
                            </span>
                            <span className="text-yellow-600 dark:text-yellow-500">
                              Ignorados: {importSummary.skipped}
                            </span>
                            <span className="text-destructive">Falhas: {importSummary.failed}</span>
                          </div>
                          <ScrollArea className="mt-3 h-32">
                            <ul className="space-y-1 text-xs">
                              {importSummary.rows.map((row) => (
                                <li
                                  key={`${row.rowNumber}-${row.email}`}
                                  className="border-b pb-1 last:border-none last:pb-0"
                                >
                                  <div className="font-medium">{row.email}</div>
                                  <div className="text-muted-foreground">
                                    Linha {row.rowNumber} • {row.status}
                                    {row.message ? ` — ${row.message}` : ''}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleImportDialogChange(false)}
                        disabled={importLoading}
                      >
                        Fechar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitImport}
                        disabled={importLoading || !fileInputRef.current?.files?.[0]}
                      >
                        {importLoading ? 'Importando...' : 'Importar alunos'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Aluno
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
              {successMessage}
            </div>
          )}
          <div className="flex items-center py-4">
            <Input
              placeholder="Filtrar por nome ou email..."
              value={(table.getColumn('fullName')?.getFilterValue() as string) ?? ''}
              onChange={(event) => {
                const value = event.target.value
                table.getColumn('fullName')?.setFilterValue(value)
                table.getColumn('email')?.setFilterValue(value)
              }}
              className="w-full md:max-w-sm"
            />
          </div>
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <p>Carregando alunos...</p>
            </div>
          ) : table.getRowModel().rows?.length ? (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {table.getRowModel().rows.map((row) => {
                  const aluno = row.original
                  return (
                    <Card key={row.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{aluno.fullName || '-'}</h3>
                            <p className="text-sm text-muted-foreground">{aluno.email}</p>
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
                              <DropdownMenuItem onClick={() => handleEdit(aluno)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(aluno)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {aluno.cpf && (
                            <div>
                              <span className="text-muted-foreground">CPF: </span>
                              <span>{aluno.cpf}</span>
                            </div>
                          )}
                          {aluno.phone && (
                            <div>
                              <span className="text-muted-foreground">Telefone: </span>
                              <span>{aluno.phone}</span>
                            </div>
                          )}
                          {aluno.enrollmentNumber && (
                            <div>
                              <span className="text-muted-foreground">Matrícula: </span>
                              <span>{aluno.enrollmentNumber}</span>
                            </div>
                          )}
                        </div>
                        {aluno.courses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {aluno.courses.map((course) => (
                              <Badge key={course.id} variant="outline" className="text-xs">
                                {course.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border">
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
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
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
                  <Users className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Nenhum aluno encontrado</EmptyTitle>
                <EmptyDescription>
                  Você ainda não criou nenhum aluno. Comece criando seu primeiro aluno.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Aluno
                </Button>
              </EmptyContent>
            </Empty>
          )}
          {table.getRowModel().rows?.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
              <div className="text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} registro(s) encontrado(s).
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {mounted && editingAluno && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
              <DialogDescription>
                Atualize as informações do aluno.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField
                    control={editForm.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? (() => {
                              // Converter string YYYY-MM-DD para Date sem problemas de timezone
                              const [year, month, day] = field.value.split('-').map(Number)
                              return new Date(year, month - 1, day)
                            })() : null}
                            onChange={(date) => {
                              if (date) {
                                // Converter Date para string YYYY-MM-DD sem problemas de timezone
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                field.onChange(`${year}-${month}-${day}`)
                              } else {
                                field.onChange(null)
                              }
                            }}
                            placeholder="dd/mm/yyyy"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormField
                    control={editForm.control}
                    name="enrollmentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Matrícula</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="courseIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cursos *</FormLabel>
                      <div className="space-y-2 rounded-md border p-3">
                        {coursesLoading ? (
                          <p className="text-sm text-muted-foreground">Carregando cursos...</p>
                        ) : courseOptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum curso disponível. Cadastre um curso antes de adicionar alunos.
                          </p>
                        ) : (
                          courseOptions.map((course) => {
                            const selected = field.value?.includes(course.id)
                            return (
                              <label key={course.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? []
                                    if (checked) {
                                      field.onChange([...current, course.id])
                                    } else {
                                      field.onChange(current.filter((id) => id !== course.id))
                                    }
                                  }}
                                />
                                {course.name}
                              </label>
                            )
                          })
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="temporaryPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Temporária</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Senha provisória do aluno"
                            {...field}
                            value={field.value || ''}
                            onChange={(event) => {
                              setEditPasswordTouched(true)
                              field.onChange(event.target.value)
                            }}
                          />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleGenerateEditPassword}>
                          Gerar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Atualizar esta senha forçará o aluno a definir uma senha nova no próximo login.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
      {mounted && deletingAluno && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o aluno &quot;{deletingAluno.fullName || deletingAluno.email}&quot;?
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

