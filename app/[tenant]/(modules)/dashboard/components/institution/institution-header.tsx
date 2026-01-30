'use client'

import type { ReactNode } from 'react'
import { Building2, Users, GraduationCap, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface InstitutionHeaderProps {
  userName: string
  empresaNome: string
  totalAlunos: number
  totalProfessores: number
  totalCursos: number
  controls?: ReactNode
}

export function InstitutionHeader({
  userName,
  empresaNome,
  totalAlunos,
  totalProfessores,
  totalCursos,
  controls,
}: InstitutionHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <Card className="overflow-hidden bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-primary/20">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Top: Greeting + Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                <Building2 className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="page-title truncate">
                  {getGreeting()}, {userName}!
                </h1>
                <p className="page-subtitle mt-0.5 truncate">
                  {empresaNome}
                </p>
              </div>
            </div>
            {controls && (
              <div className="flex items-center gap-2 shrink-0">
                {controls}
              </div>
            )}
          </div>

          {/* Bottom: Summary stats */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{totalAlunos}</p>
                <p className="text-[11px] text-muted-foreground">{totalAlunos === 1 ? 'aluno' : 'alunos'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10">
                <GraduationCap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{totalProfessores}</p>
                <p className="text-[11px] text-muted-foreground">{totalProfessores === 1 ? 'professor' : 'professores'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{totalCursos}</p>
                <p className="text-[11px] text-muted-foreground">{totalCursos === 1 ? 'curso' : 'cursos'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
