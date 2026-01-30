'use client'

import { RankingList, type RankingItem } from '@/app/[tenant]/(modules)/dashboard/components/shared/ranking-list'
import type { StudentRankingItem } from '@/app/[tenant]/(modules)/dashboard/types'

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
    badge: student.streakDays > 0 ? `${student.streakDays}d seguidos` : undefined,
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
