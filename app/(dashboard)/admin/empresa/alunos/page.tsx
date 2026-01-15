import { studentService } from '@/backend/services/student'
import { courseService } from '@/backend/services/course'
import { AlunosClientPage } from '@/app/(dashboard)/admin/alunos/components/client-page'
import { requireUser } from '@/lib/auth'

export default async function EmpresaAlunosPage({ searchParams }: { searchParams: { page?: string, query?: string } }) {
  // Ensure only empresa admins and superadmins can access
  await requireUser({ allowedRoles: ['professor', 'empresa', 'superadmin'] })

  const page = Number(searchParams.page) || 1
  const query = searchParams.query || ''

  const [studentsResult, coursesResult] = await Promise.all([
    studentService.list({ page, perPage: 10, query }),
    courseService.list({ perPage: 100, sortBy: 'name', sortOrder: 'asc' })
  ])

  const { data: students, meta } = studentsResult
  const { data: courses } = coursesResult

  const coursesSimple = courses.map(c => ({ id: c.id, name: c.name }))

  return <AlunosClientPage students={students} meta={meta} courses={coursesSimple} />
}
