'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/shared/components/dataviz/table'
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
import { Plus, Pencil, Trash2, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { RoleTipo } from '@/app/shared/types/entities/papel'

interface PapelListItem {
  id: string
  empresaId: string | null
  nome: string
  tipo: string
  descricao: string | null
  isSystem: boolean
  createdAt: string
}

// Role type labels
const ROLE_TYPE_LABELS: Record<RoleTipo, string> = {
  professor: 'Professor',
  professor_admin: 'Prof. Admin',
  staff: 'Staff',
  admin: 'Admin',
  monitor: 'Monitor',
}

// Role type colors
const ROLE_TYPE_COLORS: Record<RoleTipo, string> = {
  professor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  professor_admin: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  staff: 'bg-muted text-muted-foreground',
  admin: 'bg-red-500/15 text-red-700 dark:text-red-400',
  monitor: 'bg-green-500/15 text-green-700 dark:text-green-400',
}

interface PapeisListClientProps {
  papeis: PapelListItem[]
  empresaId: string
}

export function PapeisListClient({ papeis, empresaId }: PapeisListClientProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/empresa/${empresaId}/papeis/${deletingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir papel')
      }

      toast.success('Papel excluído com sucesso')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir papel')
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  const systemPapeis = papeis.filter((p) => p.isSystem)
  const customPapeis = papeis.filter((p) => !p.isSystem)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => router.push(tenant ? `/${tenant}/settings/papeis/novo` : '/settings/papeis/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Papel
        </Button>
      </div>

      {/* System Roles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Papéis do Sistema</h2>
          <Badge variant="secondary" className="ml-2">
            {systemPapeis.length}
          </Badge>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemPapeis.map((papel) => (
                <TableRow key={papel.id}>
                  <TableCell className="font-medium">{papel.nome}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={ROLE_TYPE_COLORS[papel.tipo as RoleTipo]}
                    >
                      {ROLE_TYPE_LABELS[papel.tipo as RoleTipo] || papel.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {papel.descricao || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(tenant ? `/${tenant}/settings/papeis/${papel.id}` : `/settings/papeis/${papel.id}`)}
                      title="Visualizar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Custom Roles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Papéis Customizados</h2>
          <Badge variant="secondary" className="ml-2">
            {customPapeis.length}
          </Badge>
        </div>
        {customPapeis.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum papel customizado criado ainda
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(tenant ? `/${tenant}/settings/papeis/novo` : '/settings/papeis/novo')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro papel
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customPapeis.map((papel) => (
                  <TableRow key={papel.id}>
                    <TableCell className="font-medium">{papel.nome}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ROLE_TYPE_COLORS[papel.tipo as RoleTipo]}
                      >
                        {ROLE_TYPE_LABELS[papel.tipo as RoleTipo] || papel.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {papel.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(tenant ? `/${tenant}/settings/papeis/${papel.id}` : `/settings/papeis/${papel.id}`)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(papel.id)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir papel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Certifique-se de que nenhum usuário
              está usando este papel antes de excluí-lo.
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
  )
}
