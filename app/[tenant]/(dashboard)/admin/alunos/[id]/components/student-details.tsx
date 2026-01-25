'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Instagram,
  Twitter,
  Edit,
  Trash2,
  Eye,
  Key,
  BookOpen,
  Clock,
  Globe,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { toast } from '@/hooks/use-toast'
import { apiClient } from '@/shared/library/api-client'
import { createClient } from '@/app/shared/core/client'
import { StudentEditForm } from './student-edit-form'

interface StudentData {
  id: string
  empresaId: string | null
  fullName: string | null
  email: string
  cpf: string | null
  phone: string | null
  birthDate: string | null
  address: string | null
  zipCode: string | null
  cidade: string | null
  estado: string | null
  bairro: string | null
  pais: string | null
  numeroEndereco: string | null
  complemento: string | null
  enrollmentNumber: string | null
  instagram: string | null
  twitter: string | null
  hotmartId: string | null
  origemCadastro: string | null
  courses: { id: string; name: string }[]
  courseIds: string[]
  mustChangePassword: boolean
  temporaryPassword: string | null
  createdAt: string
  updatedAt: string
}

interface StudentDetailsProps {
  student: StudentData
  onUpdate: () => void
}

function formatCPF(cpf: string | null): string {
  if (!cpf) return '-'
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

function formatPhone(phone: string | null): string {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

function formatZipCode(zipCode: string | null): string {
  if (!zipCode) return '-'
  const cleaned = zipCode.replace(/\D/g, '')
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  return zipCode
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return '-'
  }
}

function formatDateTime(dateString: string): string {
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '-'
  }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-right max-w-[60%] break-words">{value}</span>
    </div>
  )
}

export function StudentDetails({ student, onUpdate }: StudentDetailsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isImpersonating, setIsImpersonating] = React.useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await apiClient.delete(`/api/student/${student.id}`)
      toast({
        title: 'Aluno excluído',
        description: 'O aluno foi excluído com sucesso.',
      })
      router.push('/admin/alunos')
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o aluno. Tente novamente.',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleViewAsStudent = async () => {
    setIsImpersonating(true)
    try {
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        toast({
          variant: 'destructive',
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar.',
        })
        return
      }

      const response = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ studentId: student.id }),
      })

      const data = await response.json().catch(() => ({ error: 'Erro desconhecido' }))

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao visualizar como aluno',
          description: data.error || 'Não foi possível iniciar a visualização.',
        })
        return
      }

      if (data.success) {
        toast({
          title: 'Modo visualização ativado',
          description: 'Você está visualizando a plataforma como este aluno.',
        })
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/aluno/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Error impersonating:', error)
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar a solicitação.',
      })
    } finally {
      setIsImpersonating(false)
    }
  }

  const fullAddress = [
    student.address,
    student.numeroEndereco ? `nº ${student.numeroEndereco}` : null,
    student.complemento,
    student.bairro,
    student.cidade,
    student.estado,
    student.pais,
  ].filter(Boolean).join(', ') || '-'

  if (isEditing) {
    return (
      <StudentEditForm
        student={student}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false)
          onUpdate()
        }}
      />
    )
  }

  return (
    <TooltipProvider>
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
            Voltar para alunos
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-600">
                {student.fullName
                  ? student.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  : '??'}
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{student.fullName || 'Sem nome'}</h1>
                <p className="text-muted-foreground">{student.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {student.mustChangePassword && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      <Key className="mr-1 h-3 w-3" />
                      Senha temporária
                    </Badge>
                  )}
                  {student.courses.length > 0 && (
                    <Badge variant="secondary">
                      <BookOpen className="mr-1 h-3 w-3" />
                      {student.courses.length} curso{student.courses.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewAsStudent}
                    disabled={isImpersonating}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver como aluno
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar plataforma como este aluno</TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informacoes Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="Nome completo" value={student.fullName || '-'} />
              <InfoRow label="CPF" value={formatCPF(student.cpf)} icon={Hash} />
              <InfoRow label="Data de nascimento" value={formatDate(student.birthDate)} icon={Calendar} />
              <InfoRow label="Matrícula" value={student.enrollmentNumber || '-'} icon={Hash} />
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="Email" value={student.email} icon={Mail} />
              <InfoRow label="Telefone" value={formatPhone(student.phone)} icon={Phone} />
              <InfoRow label="Instagram" value={student.instagram || '-'} icon={Instagram} />
              <InfoRow label="Twitter" value={student.twitter || '-'} icon={Twitter} />
            </CardContent>
          </Card>

          {/* Endereco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="Endereço completo" value={fullAddress} />
              <InfoRow label="CEP" value={formatZipCode(student.zipCode)} />
              <InfoRow label="País" value={student.pais || 'Brasil'} icon={Globe} />
            </CardContent>
          </Card>

          {/* Status da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="Cadastrado em" value={formatDateTime(student.createdAt)} />
              <InfoRow label="Última atualização" value={formatDateTime(student.updatedAt)} />
              <InfoRow label="Origem do cadastro" value={student.origemCadastro || 'Manual'} />
              {student.hotmartId && (
                <InfoRow label="ID Hotmart" value={student.hotmartId} />
              )}
              {student.mustChangePassword && student.temporaryPassword && (
                <InfoRow label="Senha temporária" value={student.temporaryPassword} icon={Key} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cursos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5" />
              Cursos Matriculados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum curso matriculado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {student.courses.map((course) => (
                  <Badge
                    key={course.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-zinc-100"
                    onClick={() => router.push(`/admin/cursos/${course.id}`)}
                  >
                    {course.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o aluno <strong>{student.fullName || student.email}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
