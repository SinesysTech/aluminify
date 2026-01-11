import { requireUser } from '@/lib/auth'

export default async function EmpresaDashboardPage() {
  const user = await requireUser({ allowedRoles: ['empresa'] })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard da Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {user.fullName || user.email}
        </p>
        {user.empresaNome && (
          <p className="text-sm text-muted-foreground">
            Empresa: {user.empresaNome}
          </p>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as configurações da empresa
          </p>
        </div>
        
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie administradores, professores e alunos
          </p>
        </div>
        
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Visualize relatórios e estatísticas
          </p>
        </div>
      </div>
    </div>
  )
}




