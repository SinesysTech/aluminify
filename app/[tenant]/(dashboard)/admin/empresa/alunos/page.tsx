import type { Metadata } from 'next'
import { createClient } from '@/app/shared/core/server'
import { createStudentService } from '@/app/[tenant]/(dashboard)/aluno/services'
import { createCursoService } from '@/app/[tenant]/(dashboard)/curso/services'
import { AlunosClientPage } from '@/app/(dashboard)/admin/alunos/components/client-page'
import { requireUser } from '@/app/shared/core/auth'

export const metadata: Metadata = {
  title: 'Alunos da Empresa'
}

export default async function EmpresaAlunosPage({
  searchParams,
}: {
  searchParams: { page?: string; query?: string; courseId?: string; turmaId?: string };
}) {
  // Ensure only empresa admins and superadmins can access
  await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

  const { page: pageStr, query: queryStr, courseId: courseIdStr, turmaId: turmaIdStr } = await searchParams
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
    cursoService.list({ perPage: 100, sortBy: 'name', sortOrder: 'asc' })
    ,
    // Para mostrar o total da empresa no topo (independente de filtros)
    studentService.list({ page: 1, perPage: 1 }),
  ])

  const { data: students, meta } = studentsResult
  const { data: courses } = coursesResult
  const totalAll = allStudentsMetaResult.meta.total

  const coursesSimple = courses.map(c => ({ id: c.id, name: c.name, usaTurmas: c.usaTurmas ?? false }))

  return <AlunosClientPage students={students} meta={meta} courses={coursesSimple} totalAll={totalAll} />
}
