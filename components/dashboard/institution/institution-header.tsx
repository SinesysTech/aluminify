'use client'

import { Building2, Users, GraduationCap, BookOpen } from 'lucide-react'

interface InstitutionHeaderProps {
  empresaNome: string
  totalAlunos: number
  totalProfessores: number
  totalCursos: number
}

export function InstitutionHeader({
  empresaNome,
  totalAlunos,
  totalProfessores,
  totalCursos,
}: InstitutionHeaderProps) {
  // Determinar saudaÃ§Ã£o baseada no horÃ¡rio
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <header className="flex flex-col gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {getGreeting()}, {empresaNome}!
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {totalAlunos} {totalAlunos === 1 ? 'aluno' : 'alunos'}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              {totalProfessores} {totalProfessores === 1 ? 'professor' : 'professores'}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {totalCursos} {totalCursos === 1 ? 'curso' : 'cursos'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
