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
    <header className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
        <Building2 className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h1 className="text-base font-semibold text-foreground leading-tight">
          {getGreeting()}, {empresaNome}!
        </h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {totalAlunos} alunos
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {totalProfessores} professores
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {totalCursos} cursos
          </span>
        </div>
      </div>
    </header>
  )
}
