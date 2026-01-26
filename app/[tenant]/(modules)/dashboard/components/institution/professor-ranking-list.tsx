'use client'

import { RankingList, type RankingItem } from '@/app/[tenant]/(modules)/dashboard/components/shared/ranking-list'
import type { ProfessorRankingItem } from '@/app/[tenant]/(modules)/dashboard/types'

interface ProfessorRankingListProps {
  professors: ProfessorRankingItem[]
}

export function ProfessorRankingList({ professors }: ProfessorRankingListProps) {
  const items: RankingItem[] = professors.map((professor) => ({
    id: professor.id,
    name: professor.name,
    avatarUrl: professor.avatarUrl,
    primaryValue: `${professor.alunosAtendidos} alunos`,
    secondaryValue: `${professor.agendamentosRealizados} agendamentos`,
  }))

  return (
    <RankingList
      title="Top Professores"
      items={items}
      emptyMessage="Nenhum professor com atendimentos registrados"
      className="h-full"
    />
  )
}
