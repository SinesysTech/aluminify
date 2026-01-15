import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/server'

export default async function ProfessorDashboardPage() {
  const user = await requireUser({ allowedRoles: ['professor', 'superadmin'] })

  // Verificar se precisa completar cadastro da empresa
  if (user.empresaId && user.role !== 'superadmin') {
    try {
      const supabase = await createClient();
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('cnpj, email_contato, telefone')
        .eq('id', user.empresaId)
        .maybeSingle();

      if (!error && empresa) {
        // Verificar se empresa está incompleta (sem CNPJ, email ou telefone)
        // Campos podem ser null ou string vazia
        const cnpjVazio = !empresa.cnpj || empresa.cnpj.trim() === '';
        const emailVazio = !empresa.email_contato || empresa.email_contato.trim() === '';
        const telefoneVazio = !empresa.telefone || empresa.telefone.trim() === '';
        const empresaIncompleta = cnpjVazio && emailVazio && telefoneVazio;
        
        if (empresaIncompleta) {
          redirect('/professor/empresa/completar');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar empresa:', error);
      // Continuar normalmente se houver erro
    }
  }

  // Por enquanto, redireciona para a página principal do professor
  // TODO: Implementar dashboard específico do professor
  const alunosHref = user.role === 'superadmin' ? '/superadmin/alunos' : '/admin/empresa/alunos'
  const cursosHref = '/professor/materiais'
  const agendamentosHref = '/professor/agendamentos'

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard do Professor</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {user.fullName || user.email}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href={alunosHref}
          className="block rounded-lg border p-6 transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <h2 className="text-lg font-semibold mb-2">Alunos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie seus alunos e visualize seu progresso
          </p>
        </Link>
        
        <Link
          href={cursosHref}
          className="block rounded-lg border p-6 transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <h2 className="text-lg font-semibold mb-2">Cursos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie cursos e conteúdos
          </p>
        </Link>
        
        <Link
          href={agendamentosHref}
          className="block rounded-lg border p-6 transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <h2 className="text-lg font-semibold mb-2">Agendamentos</h2>
          <p className="text-sm text-muted-foreground">
            Visualize e gerencie agendamentos
          </p>
        </Link>
      </div>
    </div>
  )
}

