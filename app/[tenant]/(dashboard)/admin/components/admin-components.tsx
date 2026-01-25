'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/app/shared/core/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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

import type { RolePermissions, ResourcePermissions, SimplePermissions, RoleTipo, Papel } from '@/types/shared/entities/papel'
import { DEFAULT_PERMISSIONS } from '@/types/shared/entities/papel'

// --- EmpresaSelector ---

interface Empresa {
    id: string;
    nome: string;
}

export function EmpresaSelector() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        async function fetchEmpresas() {
            try {
                const response = await fetch('/api/empresas');
                if (response.ok) {
                    const data = await response.json();
                    if (!cancelled) setEmpresas(data);
                }
            } catch (error) {
                console.error('Error fetching empresas:', error);
            }
        }
        fetchEmpresas();
        return () => { cancelled = true; };
    }, []);

    function handleChange(value: string) {
        setSelectedEmpresa(value);
        const url = new URL(window.location.href);
        url.searchParams.set('empresa_id', value);
        window.location.href = url.toString();
    }

    return (
        <Select value={selectedEmpresa} onValueChange={handleChange}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
                {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// --- PermissionsMatrix ---

const RESOURCE_LABELS: Record<keyof RolePermissions, string> = {
    dashboard: 'Dashboard',
    cursos: 'Cursos',
    disciplinas: 'Disciplinas',
    alunos: 'Alunos',
    usuarios: 'Usuários',
    agendamentos: 'Agendamentos',
    flashcards: 'Flashcards',
    materiais: 'Materiais',
    configuracoes: 'Configurações',
    branding: 'Branding',
    relatorios: 'Relatórios',
}

const ACTION_LABELS = {
    view: 'Visualizar',
    create: 'Criar',
    edit: 'Editar',
    delete: 'Excluir',
}

const FULL_CRUD_RESOURCES: (keyof RolePermissions)[] = [
    'cursos', 'disciplinas', 'alunos', 'usuarios', 'agendamentos', 'flashcards', 'materiais',
]

const SIMPLE_RESOURCES: (keyof RolePermissions)[] = ['configuracoes', 'branding']
const VIEW_ONLY_RESOURCES: (keyof RolePermissions)[] = ['dashboard', 'relatorios']

interface PermissionsMatrixProps {
    permissions: RolePermissions
    onChange?: (permissions: RolePermissions) => void
    readOnly?: boolean
    className?: string
}

function isResourcePermissions(value: unknown): value is ResourcePermissions {
    if (!value || typeof value !== 'object') return false
    const v = value as Record<string, unknown>
    return 'view' in v && 'create' in v && 'edit' in v && 'delete' in v
}

function isSimplePermissions(value: unknown): value is SimplePermissions {
    if (!value || typeof value !== 'object') return false
    const v = value as Record<string, unknown>
    return 'view' in v && !('create' in v) && !('delete' in v)
}

export function PermissionsMatrix({
    permissions,
    onChange,
    readOnly = false,
    className,
}: PermissionsMatrixProps) {
    const handlePermissionChange = (
        resource: keyof RolePermissions,
        action: 'view' | 'create' | 'edit' | 'delete',
        checked: boolean
    ) => {
        if (readOnly || !onChange) return

        const newPermissions: RolePermissions = { ...permissions }
        const resourcePerms = newPermissions[resource]
        let updatedResourcePerms: RolePermissions[keyof RolePermissions] = resourcePerms

        if (action === 'view' && !checked) {
            if (isResourcePermissions(resourcePerms)) updatedResourcePerms = { view: false, create: false, edit: false, delete: false }
            else if (isSimplePermissions(resourcePerms)) updatedResourcePerms = { view: false, edit: false }
            else updatedResourcePerms = { view: false }
        } else if (['create', 'edit', 'delete'].includes(action) && checked) {
            if (isResourcePermissions(resourcePerms)) {
                const next = { ...resourcePerms } as ResourcePermissions
                next[action as keyof ResourcePermissions] = checked
                next.view = true
                updatedResourcePerms = next
            } else if (isSimplePermissions(resourcePerms) && action === 'edit') {
                const next = { ...resourcePerms } as SimplePermissions
                next.edit = checked
                next.view = true
                updatedResourcePerms = next
            }
        } else {
            if (isResourcePermissions(resourcePerms)) {
                const next = { ...resourcePerms } as ResourcePermissions
                next[action as keyof ResourcePermissions] = checked
                updatedResourcePerms = next
            } else if (isSimplePermissions(resourcePerms)) {
                const next = { ...resourcePerms } as SimplePermissions
                if (action === 'view') next.view = checked
                else if (action === 'edit') next.edit = checked
                updatedResourcePerms = next
            } else if (action === 'view') {
                updatedResourcePerms = { view: checked }
            }
        }

        onChange({ ...newPermissions, [resource]: updatedResourcePerms } as RolePermissions)
    }

    const getPermissionValue = (resource: keyof RolePermissions, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
        const resourcePerms = permissions[resource]
        if (!resourcePerms || !(action in resourcePerms)) return false
        return (resourcePerms as Record<string, boolean>)[action] ?? false
    }

    const renderCheckbox = (resource: keyof RolePermissions, action: 'view' | 'create' | 'edit' | 'delete', disabled: boolean = false) => {
        return (
            <div className="flex items-center justify-center">
                <Checkbox
                    id={`${resource}-${action}`}
                    checked={getPermissionValue(resource, action)}
                    onCheckedChange={(checked) => handlePermissionChange(resource, action, checked === true)}
                    disabled={readOnly || disabled}
                    className={cn(readOnly && 'cursor-not-allowed opacity-60')}
                />
            </div>
        )
    }

    return (
        <div className={cn('rounded-lg border', className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Recurso</th>
                            <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.view}</th>
                            <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.create}</th>
                            <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.edit}</th>
                            <th className="px-4 py-3 text-center font-medium">{ACTION_LABELS.delete}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {VIEW_ONLY_RESOURCES.map((resource) => (
                            <tr key={resource} className="border-b last:border-b-0 hover:bg-muted/30">
                                <td className="px-4 py-3"><Label htmlFor={`${resource}-view`} className="font-normal">{RESOURCE_LABELS[resource]}</Label></td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'view')}</td>
                                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                            </tr>
                        ))}
                        {FULL_CRUD_RESOURCES.map((resource) => (
                            <tr key={resource} className="border-b last:border-b-0 hover:bg-muted/30">
                                <td className="px-4 py-3"><Label htmlFor={`${resource}-view`} className="font-normal">{RESOURCE_LABELS[resource]}</Label></td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'view')}</td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'create')}</td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'edit')}</td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'delete')}</td>
                            </tr>
                        ))}
                        {SIMPLE_RESOURCES.map((resource) => (
                            <tr key={resource} className="border-b last:border-b-0 hover:bg-muted/30">
                                <td className="px-4 py-3"><Label htmlFor={`${resource}-view`} className="font-normal">{RESOURCE_LABELS[resource]}</Label></td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'view')}</td>
                                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                                <td className="px-4 py-3">{renderCheckbox(resource, 'edit')}</td>
                                <td className="px-4 py-3 text-center text-muted-foreground">-</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {readOnly && <div className="border-t bg-muted/30 px-4 py-2 text-center text-sm text-muted-foreground">Permissões de papéis do sistema não podem ser alteradas</div>}
        </div>
    )
}

// --- PapelForm ---

const papelFormSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
    tipo: z.enum(['professor', 'professor_admin', 'staff', 'admin', 'monitor'] as const),
    descricao: z.string().max(500, 'Descrição muito longa').optional(),
})

type PapelFormValues = z.infer<typeof papelFormSchema>

const ROLE_TYPE_LABELS: Record<RoleTipo, string> = {
    professor: 'Professor',
    professor_admin: 'Professor Administrador',
    staff: 'Staff Administrativo',
    admin: 'Administrador',
    monitor: 'Monitor',
}

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

    const handleTipoChange = (tipo: RoleTipo) => {
        form.setValue('tipo', tipo)
        if (!isEditing) setPermissions(DEFAULT_PERMISSIONS[tipo])
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
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Papel</FormLabel>
                            <FormControl><Input placeholder="Ex: Professor de Física" {...field} /></FormControl>
                            <FormDescription>Nome descritivo para identificar o papel</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo Base</FormLabel>
                            <Select value={field.value} onValueChange={(value) => handleTipoChange(value as RoleTipo)} disabled={isEditing}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {(Object.keys(ROLE_TYPE_LABELS) as RoleTipo[]).map((tipo) => (
                                        <SelectItem key={tipo} value={tipo}>
                                            <div className="flex flex-col">
                                                <span>{ROLE_TYPE_LABELS[tipo]}</span>
                                                <span className="text-xs text-muted-foreground">{ROLE_TYPE_DESCRIPTIONS[tipo]}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>{isEditing ? 'O tipo não pode ser alterado após a criação' : 'Selecionar um tipo carrega as permissões padrão como base'}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição (opcional)</FormLabel>
                            <FormControl><Textarea placeholder="Descreva as responsabilidades deste papel..." className="resize-none" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="space-y-3">
                    <div>
                        <h3 className="text-lg font-medium">Permissões</h3>
                        <p className="text-sm text-muted-foreground">Configure o acesso a cada recurso do sistema</p>
                    </div>
                    <PermissionsMatrix permissions={permissions} onChange={setPermissions} readOnly={false} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Salvar Alterações' : 'Criar Papel'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
