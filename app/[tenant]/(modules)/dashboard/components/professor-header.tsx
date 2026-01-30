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
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
        <GraduationCap className="w-5 h-5 text-primary" />
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
