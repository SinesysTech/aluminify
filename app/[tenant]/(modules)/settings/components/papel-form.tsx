'use client'

import { useEffect } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/app/shared/components/ui/button'
import { Input } from '@/app/shared/components/forms/input'
import { Checkbox } from '@/app/shared/components/forms/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/shared/components/forms/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/shared/components/forms/select'
import { ROLE_TIPO_LABELS } from '@/app/shared/utils/papel-display'
import { DEFAULT_PERMISSIONS } from '@/app/shared/types/entities/papel'
import type { Papel, RoleTipo, RolePermissions } from '@/app/shared/types/entities/papel'

const papelFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  permissoes: z.custom<RolePermissions>(),
})

type PapelFormData = z.infer<typeof papelFormSchema>

interface PapelFormProps {
  papel?: Papel
  onSubmit?: (data: { nome: string; tipo: RoleTipo; permissoes: RolePermissions }) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
}

export function PapelForm({ papel, onSubmit, onCancel, isLoading }: PapelFormProps) {
  const form = useForm<PapelFormData>({
    resolver: zodResolver(papelFormSchema),
    defaultValues: {
      nome: papel?.nome || '',
      tipo: papel?.tipo || 'staff',
      permissoes: papel?.permissoes || DEFAULT_PERMISSIONS.staff,
    },
  })

  // Determine if we are editing or creating
  const isEditing = !!papel
  const tipo = useWatch({ control: form.control, name: 'tipo' })

  // Update permissions when type changes (only if creating)
  useEffect(() => {
    if (!isEditing && tipo && DEFAULT_PERMISSIONS[tipo as RoleTipo]) {
      form.setValue('permissoes', DEFAULT_PERMISSIONS[tipo as RoleTipo])
    }
  }, [tipo, isEditing, form])

  const handleSubmit = (data: PapelFormData) => {
    if (onSubmit) {
      onSubmit({
        nome: data.nome,
        tipo: data.tipo as RoleTipo,
        permissoes: data.permissoes,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Papel</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Professor Assistente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Função</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_TIPO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Permissões de Acesso</h3>
          <p className="text-sm text-muted-foreground">
            Defina o que este papel pode fazer em cada módulo do sistema.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(DEFAULT_PERMISSIONS.admin).map(([module, actions]) => (
              <div key={module} className="border p-4 rounded-lg space-y-3 bg-card text-card-foreground">
                <h4 className="font-semibold capitalize text-base border-b pb-2">
                  {module.replace('_', ' ')}
                </h4>
                <div className="space-y-3">
                   {Object.keys(actions).map((action) => (
                     <FormField
                       key={`${module}-${action}`}
                       control={form.control}
                       name={`permissoes.${module}.${action}` as Path<PapelFormData>}
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                           <FormControl>
                             <Checkbox
                               checked={Boolean(field.value)}
                               onCheckedChange={field.onChange}
                             />
                           </FormControl>
                           <FormLabel className="text-sm font-normal cursor-pointer capitalize">
                             {ACTION_LABELS[action] || action}
                           </FormLabel>
                         </FormItem>
                       )}
                     />
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Papel'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
