import type { Metadata } from 'next'
import { createClient } from '@/app/shared/core/server'
import { createStudentService } from '@/app/[tenant]/(modules)/usuario/services/student.service'
import { createCursoService } from '@/app/[tenant]/(modules)/curso/services'
import { AlunosClientPage } from './components/client-page'
import { requireTenantUser } from '@/app/shared/core/tenant'

export const metadata: Metadata = {
  title: 'Alunos'
}

export default async function AlunosPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{
    page?: string
    query?: string
    courseId?: string
    turmaId?: string
  }>
}) {
  const { tenant } = await params
  // Valida que o usuário pertence ao tenant da URL
  const { tenantId } = await requireTenantUser(tenant, { allowedRoles: ['usuario'] })

  const { page: pageStr, query: queryStr, courseId: courseIdStr, turmaId: turmaIdStr } =
    await searchParams

  const page = Number(pageStr) || 1
  const query = queryStr || ''
  const courseId = courseIdStr || undefined
  const turmaId = turmaIdStr || undefined

  // Usar cliente com contexto do usuário para respeitar RLS
  const supabase = await createClient()
  const studentService = createStudentService(supabase)
  const cursoService = createCursoService(supabase)

  const [studentsResult, coursesResult, allStudentsMetaResult] = await Promise.all([
    studentService.list({ page, perPage: 10, query, courseId, turmaId }),
    cursoService.list({ perPage: 100, sortBy: 'name', sortOrder: 'asc' }, tenantId),
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
