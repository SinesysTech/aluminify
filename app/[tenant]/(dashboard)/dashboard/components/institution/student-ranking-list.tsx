'use client'

import { RankingList, type RankingItem } from '@/app/shared/components/ui/ranking-list'
import type { StudentRankingItem } from '@/types/dashboard-institution'

interface StudentRankingListProps {
  students: StudentRankingItem[]
}

export function StudentRankingList({ students }: StudentRankingListProps) {
  const items: RankingItem[] = students.map((student) => ({
    id: student.id,
    name: student.name,
    avatarUrl: student.avatarUrl,
    primaryValue: student.horasEstudo,
    secondaryValue: `${student.aproveitamento}% aproveitamento`,
    badge: student.streakDays > 0 ? `${student.streakDays}ðŸ”¥` : undefined,
  }))

  return (
    <RankingList
      title="Top Alunos"
      items={items}
      emptyMessage="Nenhum aluno com atividade registrada"
      className="h-full"
    />
  )
}
