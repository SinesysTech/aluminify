"use client"

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createStudentAction } from '../actions'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/shared/library/api-client'
import { Input } from '@/app/shared/components/forms/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/shared/components/forms/select'

interface Turma {
    id: string
    nome: string
}

interface StudentSheetProps {
    isOpen: boolean
    onClose: () => void
    courses: { id: string, name: string, usaTurmas: boolean }[]
}

export function StudentSheet({ isOpen, onClose, courses }: StudentSheetProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        cpf: '',
        phone: '',
        courseId: '',
        turmaId: '',
    })

    // Turmas state
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [loadingTurmas, setLoadingTurmas] = useState(false)

    // Get selected course
    const selectedCourse = courses.find(c => c.id === formData.courseId)

    // Load turmas when course changes and it uses turmas
    useEffect(() => {
        if (!formData.courseId) {
            setTurmas([])
            setFormData(prev => ({ ...prev, turmaId: '' }))
            return
        }

        const course = courses.find(c => c.id === formData.courseId)
        if (!course?.usaTurmas) {
            setTurmas([])
            setFormData(prev => ({ ...prev, turmaId: '' }))
            return
        }

        const fetchTurmas = async () => {
            setLoadingTurmas(true)
            try {
                const response = await apiClient.get<{ data: Turma[] }>(`/api/usuario/turmas?cursoId=${formData.courseId}`)
                if (response && 'data' in response) {
                    setTurmas(response.data)
                }
            } catch (err) {
                console.error('Error fetching turmas:', err)
                setTurmas([])
            } finally {
                setLoadingTurmas(false)
            }
        }

        fetchTurmas()
    }, [formData.courseId, courses])

    // Reset form when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({ fullName: '', email: '', cpf: '', phone: '', courseId: '', turmaId: '' })
            setError('')
            setTurmas([])
        }
    }, [isOpen])

    const handleCourseChange = (courseId: string) => {
        const resolvedId = courseId === '__none__' ? '' : courseId
        setFormData(prev => ({ ...prev, courseId: resolvedId, turmaId: '' }))
    }

    const handleTurmaChange = (turmaId: string) => {
        const resolvedId = turmaId === '__none__' ? '' : turmaId
        setFormData(prev => ({ ...prev, turmaId: resolvedId }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        // Quick validation
        if (!formData.email) {
            setError('Email é obrigatório')
            setLoading(false)
            return
        }

        const payload = {
            email: formData.email,
            fullName: formData.fullName,
            cpf: formData.cpf,
            phone: formData.phone,
            courseIds: formData.courseId ? [formData.courseId] : [],
            turmaId: formData.turmaId || undefined,
        }

        const res = await createStudentAction(payload)

        if (res.success) {
            onClose()
            router.refresh()
        } else {
            setError(res.error || 'Falha ao criar aluno')
        }
        setLoading(false)
    }

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Sheet Content */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-lg z-50 flex flex-col pb-[calc(var(--bottom-nav-height)+var(--bottom-nav-safe-area))] md:pb-0 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-muted/50">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Novo Registro</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Criar credencial de acesso para aluno.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {error && (
                        <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Nome Completo</label>
                            <Input
                                type="text"
                                placeholder="Ex: João da Silva"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">E-mail</label>
                            <Input
                                type="email"
                                placeholder="aluno@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">CPF (Opcional)</label>
                                <Input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Telefone</label>
                                <Input
                                    type="text"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-border/40" />

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Configuração Acadêmica</h4>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Curso</label>
                            <Select onValueChange={handleCourseChange} value={formData.courseId || '__none__'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar curso..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Selecionar curso...</SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Turma selector - only shown when course uses turmas */}
                        {selectedCourse?.usaTurmas && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Turma</label>
                                {loadingTurmas ? (
                                    <div className="flex items-center gap-2 h-11 md:h-9 px-3 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Carregando turmas...
                                    </div>
                                ) : turmas.length === 0 ? (
                                    <div className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md border border-dashed border-border">
                                        Nenhuma turma cadastrada para este curso.
                                    </div>
                                ) : (
                                    <Select onValueChange={handleTurmaChange} value={formData.turmaId || '__none__'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecionar turma (opcional)..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Selecionar turma (opcional)...</SelectItem>
                                            {turmas.map((turma) => (
                                                <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Plano de Acesso</label>
                            <Select defaultValue="completo">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar plano..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completo">Acesso Completo</SelectItem>
                                    <SelectItem value="exatas">Apenas Matérias Exatas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border/40 bg-muted/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-input bg-background text-sm font-medium hover:bg-muted transition-colors text-foreground"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                </div>

            </div>
        </>
    )
}
