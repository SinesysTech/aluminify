import { requireUser } from '@/lib/auth'

export default async function SuperAdminDashboardPage() {
  const user = await requireUser({ allowedRoles: ['superadmin'] })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="page-title">Dashboard do Super Admin</h1>
        <p className="page-subtitle mt-2">
          Bem-vindo, {user.fullName || user.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h2 className="section-title mb-2">Empresas</h2>
          <p className="section-subtitle">
            Gerencie todas as empresas do sistema
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="section-title mb-2">Professores</h2>
          <p className="section-subtitle">
            Visualize e gerencie professores
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="section-title mb-2">Alunos</h2>
          <p className="section-subtitle">
            Visualize todos os alunos do sistema
          </p>
        </div>
      </div>
    </div>
  )
}

