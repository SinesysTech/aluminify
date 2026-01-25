"use client"

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createStudentAction } from '../actions'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

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
                const response = await apiClient.get<{ data: Turma[] }>(`/api/turma?cursoId=${formData.courseId}`)
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
        setFormData(prev => ({ ...prev, courseId, turmaId: '' }))
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
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#E4E4E7] shadow-[-4px_0_24px_rgba(0,0,0,0.05)] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="px-6 py-5 border-b border-[#E4E4E7] flex items-center justify-between bg-zinc-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Novo Registro</h2>
                        <p className="text-xs text-[#71717A] mt-0.5">Criar credencial de acesso para aluno.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-900 transition-colors"
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
                            <label className="text-xs font-medium text-zinc-700">Nome Completo</label>
                            <input
                                type="text"
                                placeholder="Ex: João da Silva"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B] transition-all font-sans"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-700">E-mail</label>
                            <input
                                type="email"
                                placeholder="aluno@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B] transition-all font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-700">CPF (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                    className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-700">Telefone</label>
                                <input
                                    type="text"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B]"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-[#E4E4E7]" />

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Configuração Acadêmica</h4>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-700">Curso</label>
                            <select
                                className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B]"
                                onChange={(e) => handleCourseChange(e.target.value)}
                                value={formData.courseId}
                            >
                                <option value="">Selecionar curso...</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Turma selector - only shown when course uses turmas */}
                        {selectedCourse?.usaTurmas && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-700">Turma</label>
                                {loadingTurmas ? (
                                    <div className="flex items-center gap-2 h-9 px-3 text-sm text-zinc-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Carregando turmas...
                                    </div>
                                ) : turmas.length === 0 ? (
                                    <div className="text-sm text-zinc-500 px-3 py-2 bg-zinc-50 rounded-md border border-dashed border-zinc-200">
                                        Nenhuma turma cadastrada para este curso.
                                    </div>
                                ) : (
                                    <select
                                        className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B]"
                                        onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                                        value={formData.turmaId}
                                    >
                                        <option value="">Selecionar turma (opcional)...</option>
                                        {turmas.map((turma) => (
                                            <option key={turma.id} value={turma.id}>{turma.nome}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-700">Plano de Acesso</label>
                            <select className="w-full h-9 px-3 rounded-md border border-[#E4E4E7] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#09090B] focus:border-[#09090B]">
                                <option>Acesso Completo</option>
                                <option>Apenas Matérias Exatas</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#E4E4E7] bg-zinc-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-md border border-[#E4E4E7] bg-white text-sm font-medium hover:bg-zinc-100 transition-colors text-zinc-700"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                </div>

            </div>
        </>
    )
}
