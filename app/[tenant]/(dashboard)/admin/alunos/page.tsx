import type { Metadata } from 'next'
import { createClient } from '@/app/shared/core/server'
import { createStudentService } from '@/app/[tenant]/(dashboard)/aluno/services'
import { createCursoService } from '@/app/[tenant]/(dashboard)/curso/services'
import { AlunosClientPage } from './components/client-page'
import { requireUser } from '@/app/shared/core/auth'

export const metadata: Metadata = {
  title: 'Alunos'
}

export default async function AlunosPage({ searchParams }: { searchParams: { page?: string, query?: string, courseId?: string, turmaId?: string } }) {
  // Apenas superadmins podem ver todos os alunos
  await requireUser({ allowedRoles: ['superadmin'] })

  const page = Number(searchParams.page) || 1
  const query = searchParams.query || ''
  const courseId = searchParams.courseId || undefined
  const turmaId = searchParams.turmaId || undefined

  // Usar cliente com contexto do usuário para respeitar RLS
  const supabase = await createClient()
  const studentService = createStudentService(supabase)
  const cursoService = createCursoService(supabase)

  const [studentsResult, coursesResult, allStudentsMetaResult] = await Promise.all([
    studentService.list({ page, perPage: 10, query, courseId, turmaId }),
    cursoService.list({ perPage: 100, sortBy: 'name', sortOrder: 'asc' }),
    // Para mostrar o total geral no topo (independente de filtros)
    studentService.list({ page: 1, perPage: 1 }),
  ])

  const { data: students, meta } = studentsResult
  const { data: courses } = coursesResult
  const totalAll = allStudentsMetaResult.meta?.total ?? 0

  // Map courses to lighter object with usaTurmas info
  const coursesSimple = courses.map(c => ({ id: c.id, name: c.name, usaTurmas: c.usaTurmas ?? false }))

  return <AlunosClientPage students={students} meta={meta} courses={coursesSimple} totalAll={totalAll} />
}
