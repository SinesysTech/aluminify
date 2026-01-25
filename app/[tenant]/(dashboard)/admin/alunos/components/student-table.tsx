"use client"

import { useState, useEffect } from 'react'
import { Eye, Trash2, UserCog } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Student } from '@/types/shared/entities/user'
import { createClient } from '@/app/shared/core/client'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { DeleteStudentDialog } from './delete-student-dialog'
import { toast } from '@/hooks/use-toast'
import type { PaginationMeta } from '@/types/shared/dtos/api-responses'

interface StudentTableProps {
    students: Student[]
    meta: PaginationMeta
}

export function StudentTable({ students, meta }: StudentTableProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        setMounted(true)
    }, [])

    const goToPage = (page: number) => {
        const nextPage = Math.max(1, page)
        const params = new URLSearchParams(searchParams)
        params.set('page', String(nextPage))
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleDeleteClick = (student: Student) => {
        setStudentToDelete(student)
        setDeleteDialogOpen(true)
    }

    const handleViewAsStudent = async (studentId: string) => {
        setLoadingId(studentId)
        try {
            // Obter token de autenticação
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
                body: JSON.stringify({ studentId }),
            })

            const data = await response.json().catch(() => ({ error: 'Erro desconhecido' }))

            if (!response.ok) {
                console.error('Erro na resposta da API:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data,
                })
                toast({
                    variant: 'destructive',
                    title: 'Erro ao visualizar como aluno',
                    description: data.error || `Não foi possível iniciar a visualização. Tente novamente.`,
                })
                return
            }

            if (data.success) {
                toast({
                    title: 'Modo visualização ativado',
                    description: 'Você está visualizando a plataforma como este aluno.',
                })
                // Aguardar um pouco para garantir que o cookie foi definido
                await new Promise(resolve => setTimeout(resolve, 100))
                router.push('/aluno/dashboard')
                router.refresh()
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao visualizar como aluno',
                    description: data.error || 'Não foi possível iniciar a visualização.',
                })
            }
        } catch (error) {
            console.error('Erro ao iniciar visualização:', error)
            toast({
                variant: 'destructive',
                title: 'Erro inesperado',
                description: 'Ocorreu um erro ao processar a solicitação. Tente novamente.',
            })
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <TooltipProvider>
            <div className="overflow-hidden flex-1">
                <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E4E4E7]">
                    <tr>
                        <th className="h-10 px-4 font-medium text-[#71717A] uppercase tracking-wider text-xs">Aluno / Email</th>
                        <th className="h-10 px-4 font-medium text-[#71717A] uppercase tracking-wider text-xs">Cursos</th>
                        <th className="h-10 px-4 font-medium text-[#71717A] uppercase tracking-wider text-xs w-[150px]">Status</th>
                        <th className="h-10 px-4 font-medium text-[#71717A] uppercase tracking-wider text-xs w-[200px]">Progresso</th>
                        <th className="h-10 px-4 font-medium text-[#71717A] uppercase tracking-wider text-xs text-right w-[60px]">Ações</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-[#E4E4E7]">
                    {students.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500">
                                Nenhum aluno encontrado com esses filtros.
                            </td>
                        </tr>
                    ) : (
                        students.map((student) => {
                            const initials = student.fullName
                                ? student.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                                : '??';
                            const status = 'Ativo'; // Mocked for now as it's not in Student type yet
                            const progress = 0; // Mocked for now

                            return (
                                <tr key={student.id} className="group hover:bg-zinc-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="font-medium text-zinc-900">{student.fullName || 'Sem nome'}</div>
                                                <div className="font-mono text-xs text-[#71717A]">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {student.courses && student.courses.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {student.courses.map((course) => (
                                                    <span
                                                        key={course.id}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
                                                    >
                                                        {course.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status === 'Ativo'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${status === 'Ativo' ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-mono text-xs text-[#71717A]">{progress}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {mounted ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => router.push(`/admin/alunos/${student.id}`)}
                                                        >
                                                            <UserCog className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Ver Perfil</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => handleViewAsStudent(student.id)}
                                                            disabled={loadingId === student.id}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {loadingId === student.id ? 'Carregando...' : 'Visualizar como Aluno'}
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                            onClick={() => handleDeleteClick(student)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Excluir Aluno</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                                                    <UserCog className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })
                    )}
                    </tbody>
                </table>

                <div className="border-t border-[#E4E4E7] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-[#71717A]">
                        {meta.total === 0 ? (
                            <>Mostrando <strong>0</strong> resultados</>
                        ) : (
                            <>
                                Mostrando{' '}
                                <strong>{(meta.page - 1) * meta.perPage + 1}</strong>
                                {'-'}
                                <strong>{Math.min(meta.page * meta.perPage, meta.total)}</strong>
                                {' '}de <strong>{meta.total}</strong>
                            </>
                        )}
                        {meta.totalPages > 1 ? <> • Página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong></> : null}
                    </span>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                            disabled={meta.page <= 1}
                            onClick={() => goToPage(meta.page - 1)}
                        >
                            Anterior
                        </button>
                        <button
                            className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                            disabled={meta.page >= meta.totalPages}
                            onClick={() => goToPage(meta.page + 1)}
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>

            <DeleteStudentDialog
                student={studentToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </TooltipProvider>
    )
}
