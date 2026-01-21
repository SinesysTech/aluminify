'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, Calendar, BookOpen, Search, MoreHorizontal, Mail, Phone, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { apiClient } from '@/lib/api-client'

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  state: string | null
}

interface Enrollment {
  id: string
  enrollmentDate: string
  startDate: string
  endDate: string
  active: boolean
  student: Student | null
}

interface CourseData {
  id: string
  name: string
  modality: string
  type: string
  year: number
}

interface EnrollmentsResponse {
  data: {
    course: CourseData
    enrollments: Enrollment[]
    total: number
  }
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [course, setCourse] = React.useState<CourseData | null>(null)
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await apiClient.get<EnrollmentsResponse>(`/api/course/${courseId}/enrollments`)
        if (response?.data) {
          setCourse(response.data.course)
          setEnrollments(response.data.enrollments)
        }
      } catch (err) {
        console.error('Error fetching course enrollments:', err)
        setError('Erro ao carregar dados do curso')
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchData()
    }
  }, [courseId])

  const filteredEnrollments = React.useMemo(() => {
    if (!searchTerm) return enrollments
    const term = searchTerm.toLowerCase()
    return enrollments.filter((e) => {
      const student = e.student
      if (!student) return false
      return (
        student.name?.toLowerCase().includes(term) ||
        student.email?.toLowerCase().includes(term) ||
        student.city?.toLowerCase().includes(term)
      )
    })
  }, [enrollments, searchTerm])

  const activeCount = enrollments.filter((e) => e.active).length
  const inactiveCount = enrollments.filter((e) => !e.active).length

  if (loading) {
    return (
      <div className="flex flex-col gap-8 h-full pb-10">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded mb-2" />
          <div className="h-4 w-96 bg-zinc-100 rounded" />
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error || 'Curso não encontrado'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[#E4E4E7] pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para cursos
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{course.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{course.modality}</Badge>
              <Badge variant="outline">{course.type}</Badge>
              <Badge variant="secondary">{course.year}</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{enrollments.length}</p>
              <p className="text-sm text-zinc-500">Total de alunos</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-sm text-zinc-500">Matrículas ativas</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{inactiveCount}</p>
              <p className="text-sm text-zinc-500">Matrículas inativas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          <Input
            type="text"
            placeholder="Buscar aluno por nome, email ou cidade..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Students Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-lg bg-zinc-50">
          <Users className="w-12 h-12 text-zinc-300 mb-4" />
          <h3 className="text-lg font-medium text-zinc-600">
            {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {searchTerm
              ? 'Tente ajustar os termos de busca'
              : 'Este curso ainda não possui alunos matriculados'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredEnrollments.map((enrollment) => {
              const student = enrollment.student
              if (!student) return null

              return (
                <div
                  key={enrollment.id}
                  className="rounded-lg border border-[#E4E4E7] bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{student.name || 'Sem nome'}</h3>
                      <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        {student.email}
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-1 text-sm text-zinc-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          {student.phone}
                        </div>
                      )}
                      {(student.city || student.state) && (
                        <div className="flex items-center gap-1 text-sm text-zinc-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {[student.city, student.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    <Badge variant={enrollment.active ? 'default' : 'secondary'}>
                      {enrollment.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="mt-3 pt-3 border-t text-xs text-zinc-500">
                    Matrícula: {format(new Date(enrollment.enrollmentDate), "dd/MM/yyyy", { locale: ptBR })}
                    {' · '}
                    Acesso até: {format(new Date(enrollment.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-[#E4E4E7] overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-medium">Aluno</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Telefone</TableHead>
                  <TableHead className="font-medium">Cidade/Estado</TableHead>
                  <TableHead className="font-medium">Data Matrícula</TableHead>
                  <TableHead className="font-medium">Acesso até</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => {
                  const student = enrollment.student
                  if (!student) return null

                  return (
                    <TableRow key={enrollment.id} className="hover:bg-zinc-50">
                      <TableCell className="font-medium">
                        {student.name || 'Sem nome'}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                      <TableCell>
                        {[student.city, student.state].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(enrollment.enrollmentDate), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(enrollment.endDate), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={enrollment.active ? 'default' : 'secondary'}>
                          {enrollment.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/alunos?email=${student.email}`)}
                            >
                              Ver perfil do aluno
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-zinc-500">
            Mostrando {filteredEnrollments.length} de {enrollments.length} alunos
          </div>
        </>
      )}
    </div>
  )
}
