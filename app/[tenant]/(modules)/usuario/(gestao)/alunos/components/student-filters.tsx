"use client"

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/library/api-client'

interface TurmaOption {
    id: string
    nome: string
    cursoNome: string
}

interface Course {
    id: string
    name: string
    usaTurmas?: boolean
}

export function StudentFilters() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    const [turmas, setTurmas] = useState<TurmaOption[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loadingTurmas, setLoadingTurmas] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch turmas
                const turmasResponse = await apiClient.get<{ data: Array<{ id: string; nome: string; cursoNome: string }> }>('/api/usuario/turmas')
                if (turmasResponse && 'data' in turmasResponse) {
                    setTurmas(turmasResponse.data)
                }

                // Fetch courses for course filter
                const coursesResponse = await apiClient.get<{ data: Course[] }>('/api/curso')
                if (coursesResponse && 'data' in coursesResponse) {
                    setCourses(coursesResponse.data)
                }
            } catch (error) {
                console.error('Error fetching filter options:', error)
            } finally {
                setLoadingTurmas(false)
            }
        }
        fetchData()
    }, [])

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('query', term)
            params.set('page', '1') // Reset to first page on search
        } else {
            params.delete('query')
        }
        replace(`${pathname}?${params.toString()}`)
    }, 300)

    const handleCourseChange = (courseId: string) => {
        const params = new URLSearchParams(searchParams)
        if (courseId && courseId !== '__all__') {
            params.set('courseId', courseId)
            params.set('page', '1')
        } else {
            params.delete('courseId')
        }
        // Clear turma filter when changing course
        params.delete('turmaId')
        replace(`${pathname}?${params.toString()}`)
    }

    const handleTurmaChange = (turmaId: string) => {
        const params = new URLSearchParams(searchParams)
        if (turmaId && turmaId !== '__all__') {
            params.set('turmaId', turmaId)
            params.set('page', '1')
        } else {
            params.delete('turmaId')
        }
        replace(`${pathname}?${params.toString()}`)
    }

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams)
        if (status && status !== '__all__') {
            params.set('status', status)
            params.set('page', '1')
        } else {
            params.delete('status')
        }
        replace(`${pathname}?${params.toString()}`)
    }

    const selectedCourseId = searchParams.get('courseId') || '__all__'
    const selectedTurmaId = searchParams.get('turmaId') || '__all__'
    const selectedStatus = searchParams.get('status') || '__all__'

    // Filter turmas by selected course if any
    const filteredTurmas = selectedCourseId !== '__all__'
        ? turmas.filter(t => {
            // Match turma to course by cursoNome (we'd need cursoId in the API response for better matching)
            const course = courses.find(c => c.id === selectedCourseId)
            return course && t.cursoNome === course.name
        })
        : turmas

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou ID..."
                    className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('query')?.toString()}
                />
            </div>
            <div className="flex items-center gap-2">
                <select
                    className="h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                >
                    <option value="__all__">Status: Todos</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>
                <select
                    className="h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                >
                    <option value="__all__">Curso: Todos</option>
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                    ))}
                </select>
                <select
                    className="h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedTurmaId}
                    onChange={(e) => handleTurmaChange(e.target.value)}
                    disabled={loadingTurmas || filteredTurmas.length === 0}
                >
                    <option value="__all__">
                        {loadingTurmas
                            ? 'Carregando turmas...'
                            : filteredTurmas.length === 0
                                ? 'Nenhuma turma'
                                : 'Turma: Todas'}
                    </option>
                    {filteredTurmas.map((turma) => (
                        <option key={turma.id} value={turma.id}>
                            {turma.nome} ({turma.cursoNome})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
