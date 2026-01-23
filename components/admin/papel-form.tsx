'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PermissionsMatrix } from './permissions-matrix'
import type { RolePermissions, RoleTipo, Papel } from '@/types/shared/entities/papel'
import { DEFAULT_PERMISSIONS } from '@/types/shared/entities/papel'
import { Loader2 } from 'lucide-react'

// Form validation schema
const papelFormSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  tipo: z.enum(['professor', 'professor_admin', 'staff', 'admin', 'monitor'] as const),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
})

type PapelFormValues = z.infer<typeof papelFormSchema>

// Role type labels
const ROLE_TYPE_LABELS: Record<RoleTipo, string> = {
  professor: 'Professor',
  professor_admin: 'Professor Administrador',
  staff: 'Staff Administrativo',
  admin: 'Administrador',
  monitor: 'Monitor',
}

// Role type descriptions
const ROLE_TYPE_DESCRIPTIONS: Record<RoleTipo, string> = {
  professor: 'Acesso às próprias disciplinas e agendamentos',
  professor_admin: 'Professor com poderes administrativos completos',
  staff: 'Funcionário administrativo (não leciona)',
  admin: 'Acesso total à empresa',
  monitor: 'Nível básico para monitoria de disciplinas',
}

interface PapelFormProps {
  papel?: Papel
  onSubmit: (data: { nome: string; tipo: RoleTipo; descricao?: string; permissoes: RolePermissions }) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function PapelForm({ papel, onSubmit, onCancel, isLoading = false }: PapelFormProps) {
  const isEditing = !!papel

  // Initialize permissions based on existing papel or default for tipo
  const [permissions, setPermissions] = useState<RolePermissions>(
    papel?.permissoes ?? DEFAULT_PERMISSIONS.professor
  )

  const form = useForm<PapelFormValues>({
    resolver: zodResolver(papelFormSchema),
    defaultValues: {
      nome: papel?.nome ?? '',
      tipo: papel?.tipo ?? 'professor',
      descricao: papel?.descricao ?? '',
    },
  })

  // Update permissions when tipo changes (only if creating new)
  const handleTipoChange = (tipo: RoleTipo) => {
    form.setValue('tipo', tipo)
    if (!isEditing) {
      // Only auto-update permissions when creating a new papel
      setPermissions(DEFAULT_PERMISSIONS[tipo])
    }
  }

  const handleSubmit = async (values: PapelFormValues) => {
    await onSubmit({
      nome: values.nome,
      tipo: values.tipo,
      descricao: values.descricao,
      permissoes: permissions,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Nome */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Papel</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Professor de Física" {...field} />
              </FormControl>
              <FormDescription>
                Nome descritivo para identificar o papel
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Base</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => handleTipoChange(value as RoleTipo)}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(ROLE_TYPE_LABELS) as RoleTipo[]).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      <div className="flex flex-col">
                        <span>{ROLE_TYPE_LABELS[tipo]}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_TYPE_DESCRIPTIONS[tipo]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {isEditing
                  ? 'O tipo não pode ser alterado após a criação'
                  : 'Selecionar um tipo carrega as permissões padrão como base'
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva as responsabilidades deste papel..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Permissões */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-medium">Permissões</h3>
            <p className="text-sm text-muted-foreground">
              Configure o acesso a cada recurso do sistema
            </p>
          </div>
          <PermissionsMatrix
            permissions={permissions}
            onChange={setPermissions}
            readOnly={false}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Papel'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
