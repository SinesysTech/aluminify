'use client'

import { Building2, Users, GraduationCap, BookOpen } from 'lucide-react'

interface InstitutionHeaderProps {
  userName: string
  empresaNome: string
  totalAlunos: number
  totalProfessores: number
  totalCursos: number
}

export function InstitutionHeader({
  userName,
  empresaNome: _empresaNome,
  totalAlunos,
  totalProfessores,
  totalCursos,
}: InstitutionHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="page-title truncate">
            {getGreeting()}, {userName}!
          </h1>
          <p className="page-subtitle mt-0.5">Painel da instituição</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">{totalAlunos}</span>
          <span className="hidden sm:inline">{totalAlunos === 1 ? 'aluno' : 'alunos'}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground">
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">{totalProfessores}</span>
          <span className="hidden sm:inline">{totalProfessores === 1 ? 'professor' : 'professores'}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">{totalCursos}</span>
          <span className="hidden sm:inline">{totalCursos === 1 ? 'curso' : 'cursos'}</span>
        </div>
      </div>
    </header>
  )
}
