'use client'

import { GraduationCap } from 'lucide-react'

interface ProfessorHeaderProps {
  professorNome: string
}

export function ProfessorHeader({ professorNome }: ProfessorHeaderProps) {
  // Determinar saudaÃ§Ã£o baseada no horÃ¡rio
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Extrair primeiro nome
  const firstName = professorNome.split(' ')[0]

  return (
    <header className="flex items-center gap-3 sm:gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
        <GraduationCap className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h1 className="page-title">
          {getGreeting()}, Professor {firstName}!
        </h1>
        <p className="page-subtitle mt-1">
          Acompanhe seus alunos e agendamentos
        </p>
      </div>
    </header>
  )
}
