'use client'

import * as React from 'react'
import { useCurrentUser } from '@/components/providers/user-provider'
import StudentLibrary from './components/student-library'
import MateriaisClientPage from './materiais/materiais-client'
import { Loader2 } from 'lucide-react'

interface BibliotecaClientProps {
    title?: string
    description?: string
}

export default function BibliotecaClient({
    title = 'Biblioteca',
    description = 'Acesse todo o conteúdo didático e materiais de estudo',
}: BibliotecaClientProps) {
    const currentUser = useCurrentUser()
    const userRole = currentUser.role
    const isLoading = !currentUser // In case user provider is loading, though it usually blocks.

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Role-based rendering
    if (userRole === 'aluno') {
        return <StudentLibrary title={title} description={description} />
    }

    if (userRole === 'professor' || userRole === 'usuario') {
        return <MateriaisClientPage />
    }

    // Fallback or unauthorized view (optional, could be same as student or a restricted view)
    return <StudentLibrary title={title} description={description} />
}
