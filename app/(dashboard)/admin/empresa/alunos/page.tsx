import { createClient } from '@/lib/server'
import { createStudentService } from '@/backend/services/student'
import { createCourseService } from '@/backend/services/course'
import { AlunosClientPage } from '@/app/(dashboard)/admin/alunos/components/client-page'
import { requireUser } from '@/lib/auth'

export default async function EmpresaAlunosPage({ searchParams }: { searchParams: { page?: string, query?: string } }) {
  // Ensure only empresa admins and superadmins can access
  await requireUser({ allowedRoles: ['professor', 'usuario', 'superadmin'] })

  const { page: pageStr, query: queryStr } = await searchParams
  const page = Number(pageStr) || 1
  const query = queryStr || ''

  // Usar cliente com contexto do usuário para respeitar RLS
  const supabase = await createClient()
  const studentService = createStudentService(supabase)
  const courseService = createCourseService(supabase)

  const [studentsResult, coursesResult] = await Promise.all([
    studentService.list({ page, perPage: 10, query }),
    courseService.list({ perPage: 100, sortBy: 'name', sortOrder: 'asc' })
  ])

  const { data: students, meta } = studentsResult
  const { data: courses } = coursesResult

  const coursesSimple = courses.map(c => ({ id: c.id, name: c.name }))

  return <AlunosClientPage students={students} meta={meta} courses={coursesSimple} />
}
