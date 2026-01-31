'use client'

import { GraduationCap } from 'lucide-react'

interface ProfessorHeaderProps {
  professorNome: string
}

export function ProfessorHeader({ professorNome }: ProfessorHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const firstName = professorNome.split(' ')[0]

  return (
    <header className="flex items-center gap-3 sm:gap-4">
      <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
        <GraduationCap className="h-6 w-6 md:h-7 md:w-7 text-primary" />
      </div>
      <div className="min-w-0">
        <h1 className="page-title truncate">
          {getGreeting()}, Professor {firstName}!
        </h1>
        <p className="page-subtitle mt-0.5">
          Acompanhe seus alunos e agendamentos
        </p>
      </div>
    </header>
  )
}
