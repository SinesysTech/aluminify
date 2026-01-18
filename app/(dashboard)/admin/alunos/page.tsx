import { createClient } from '@/lib/server'
import { createStudentService } from '@/backend/services/student'
import { createCourseService } from '@/backend/services/course'
import { AlunosClientPage } from './components/client-page'
import { requireUser } from '@/lib/auth'

export default async function AlunosPage({ searchParams }: { searchParams: { page?: string, query?: string } }) {
  // Apenas superadmins podem ver todos os alunos
  await requireUser({ allowedRoles: ['superadmin'] })

  const page = Number(searchParams.page) || 1
  const query = searchParams.query || ''

  // Usar cliente com contexto do usuÃ¡rio para respeitar RLS
  const supabase = await createClient()
  const studentService = createStudentService(supabase)
  const courseService = createCourseService(supabase)

  const [studentsResult, coursesResult] = await Promise.all([
    studentService.list({ page, perPage: 10, query }),
    courseService.list({ perPage: 100, sortBy: 'name', sortOrder: 'asc' })
  ])

  const { data: students, meta } = studentsResult
  const { data: courses } = coursesResult

  // Map courses to lighter object if needed, or pass Course type if updated on client
  const coursesSimple = courses.map(c => ({ id: c.id, name: c.name }))

  return <AlunosClientPage students={students} meta={meta} courses={coursesSimple} />
}
