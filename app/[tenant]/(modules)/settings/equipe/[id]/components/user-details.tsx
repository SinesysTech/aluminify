'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Hash,
  Edit,
  Trash2,
  Shield,
  Briefcase,
  Clock,
  CreditCard,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/shared/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { toast } from '@/hooks/use-toast'
import { UserEditForm } from './user-edit-form'

interface Papel {
  id: string
  nome: string
  tipo: string
  descricao: string | null
}

interface UserData {
  id: string
  empresaId: string
  papelId: string
  papel?: Papel
  nomeCompleto: string
  email: string
  cpf: string | null
  telefone: string | null
  chavePix: string | null
  fotoUrl: string | null
  biografia: string | null
  especialidade: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

interface UserDetailsProps {
  user: UserData
  empresaId: string
  papeis: Papel[]
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

function formatDateTime(dateString: string): string {
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '-'
  }
}

function getRoleBadgeVariant(tipo: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (tipo) {
    case 'admin':
      return 'default'
    case 'professor_admin':
      return 'default'
    case 'professor':
      return 'secondary'
    case 'staff':
      return 'outline'
    case 'monitor':
      return 'outline'
    default:
      return 'secondary'
  }
}

function getRoleLabel(tipo: string): string {
  switch (tipo) {
    case 'admin':
      return 'Admin'
    case 'professor_admin':
      return 'Professor Admin'
    case 'professor':
      return 'Professor'
    case 'staff':
      return 'Staff'
    case 'monitor':
      return 'Monitor'
    default:
      return tipo
  }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-right max-w-[60%] wrap-break-word">{value}</span>
    </div>
  )
}

export function UserDetails({ user, empresaId, papeis, onUpdate }: UserDetailsProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string
  const [isEditing, setIsEditing] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/empresa/${empresaId}/usuarios/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao excluir usuário')
      }

      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi excluído com sucesso.',
      })
      router.push(tenant ? `/${tenant}/empresa/agendamentos/configuracoes?tab=usuarios` : '/empresa/agendamentos/configuracoes?tab=usuarios')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Não foi possível excluir o usuário.',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const initials = user.nomeCompleto
    ? user.nomeCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '??'

  if (isEditing) {
    return (
      <UserEditForm
        user={user}
        empresaId={empresaId}
        papeis={papeis}
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
        <header className="flex flex-col gap-4 border-b border-border pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.fotoUrl || undefined} alt={user.nomeCompleto} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold">{user.nomeCompleto}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(user.papel?.tipo || '')}>
                    <Shield className="mr-1 h-3 w-3" />
                    {user.papel?.nome || getRoleLabel(user.papel?.tipo || '')}
                  </Badge>
                  <Badge variant={user.ativo ? 'default' : 'secondary'}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remover usuário da empresa</TooltipContent>
              </Tooltip>
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
              <InfoRow label="Nome completo" value={user.nomeCompleto} />
              <InfoRow label="CPF" value={formatCPF(user.cpf)} icon={Hash} />
              <InfoRow label="Especialidade" value={user.especialidade || '-'} icon={Briefcase} />
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
              <InfoRow label="Email" value={user.email} icon={Mail} />
              <InfoRow label="Telefone" value={formatPhone(user.telefone)} icon={Phone} />
              <InfoRow label="Chave PIX" value={user.chavePix || '-'} icon={CreditCard} />
            </CardContent>
          </Card>

          {/* Perfil Profissional */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Biografia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.biografia ? (
                <p className="text-sm whitespace-pre-wrap">{user.biografia}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma biografia cadastrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Status da Conta */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Papel/Função</p>
                  <p className="font-medium">{user.papel?.nome || '-'}</p>
                  {user.papel?.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">{user.papel.descricao}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cadastrado em</p>
                  <p className="font-medium">{formatDateTime(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{formatDateTime(user.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{user.nomeCompleto}</strong>?
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
