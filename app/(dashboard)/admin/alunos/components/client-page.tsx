"use client"

import { useState } from 'react'
import { Plus, Upload, UserPlus } from 'lucide-react'
import { Student } from '@/types/shared/entities/user'
import { StudentFilters } from './student-filters'
import { StudentTable } from './student-table'
import { StudentSheet } from './student-sheet'
import { PaginationMeta } from '@/types/shared/dtos/api-responses'

interface AlunosClientPageProps {
    students: Student[]
    meta: PaginationMeta
    courses: { id: string, name: string }[]
}

export function AlunosClientPage({ students, meta, courses }: AlunosClientPageProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const hasStudents = meta.total > 0

    return (
        <div className="flex flex-col gap-8 h-full">

            {/* SECTION 1: HEADER & POPULATED STATE (Always visible if we have students OR we are filtering) */}
            {(hasStudents || meta.total === 0 /* show even if 0 if we assume it's filtered result, but for empty state logic: */) ? (
                <section id="populated-state" className={`flex flex-col gap-4 h-full min-h-[600px] ${!hasStudents && 'hidden' /* Just to toggle section visibility based on true empty state if desired, but let's keep it simple */}`}>
                    {/* Note: The user might want the empty state ONLY if the database is truly empty, not just no search results. 
                 But for now, if we have students, we show them. 
                 If we don't, we show empty state. 
                 We need to distinguish "No results found" vs "No students in DB". 
                 The meta.total should be the total filtered. 
                 If query is empty and total is 0, it's Empty State.
              */}

                    {/* If existing students found, render standard view */}
                    {hasStudents && (
                        <>
                            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Alunos</h1>
                                    <p className="text-sm text-[#71717A]">Gerencie matrículas, progresso e status financeiro.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="h-9 px-4 rounded-md border border-[#E4E4E7] bg-white text-sm font-medium hover:bg-zinc-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2 text-zinc-900">
                                        <Upload className="w-5 h-5" strokeWidth={1.5} />
                                        Importar CSV
                                    </button>
                                    <button
                                        onClick={() => setIsSheetOpen(true)}
                                        className="h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" strokeWidth={1.5} />
                                        Novo Aluno
                                    </button>
                                </div>
                            </header>

                            <StudentFilters />

                            <StudentTable students={students} />
                        </>
                    )}
                </section>
            ) : null}

            {/* SECTION 2: EMPTY STATE (Only if truly empty) */}
            {!hasStudents && (
                <section id="empty-state" className="flex-1 flex flex-col items-center justify-center min-h-[400px]">

                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-[#E4E4E7]">
                        <UserPlus className="w-8 h-8 text-zinc-400" strokeWidth={1} />
                    </div>

                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">Base de alunos vazia</h3>
                    <p className="text-sm text-[#71717A] text-center max-w-sm mb-8 leading-relaxed">
                        Sua infraestrutura está pronta. Adicione alunos manualmente para gerar credenciais ou importe em massa.
                    </p>

                    <div className="flex items-center gap-3">
                        <button className="h-10 px-6 rounded-md border border-[#E4E4E7] bg-white text-sm font-medium hover:bg-zinc-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2 text-zinc-900">
                            <Upload className="w-5 h-5" strokeWidth={1.5} />
                            Importar Planilha
                        </button>
                        <button
                            onClick={() => setIsSheetOpen(true)}
                            className="h-10 px-6 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" strokeWidth={1.5} />
                            Adicionar Manualmente
                        </button>
                    </div>
                </section>
            )}

            <StudentSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} courses={courses} />

        </div>
    )
}
