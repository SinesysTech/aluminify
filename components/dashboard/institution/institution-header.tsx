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
    <header className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
        <Building2 className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 className="page-title">
          {getGreeting()}, {userName}!
        </h1>
        <div className="flex items-center gap-4 page-subtitle">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {totalAlunos} {totalAlunos === 1 ? 'aluno' : 'alunos'}
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            {totalProfessores} {totalProfessores === 1 ? 'professor' : 'professores'}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            {totalCursos} {totalCursos === 1 ? 'curso' : 'cursos'}
          </span>
        </div>
      </div>
    </header>
  )
}
