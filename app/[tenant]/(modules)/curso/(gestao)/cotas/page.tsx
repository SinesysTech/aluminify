import type { Metadata } from 'next'
import { requireUser } from '@/app/shared/core/auth'
import { CotasTable } from './components/cotas-table'

export const metadata: Metadata = {
  title: 'Cotas de Atendimento',
}

export default async function CotasPage() {
  await requireUser({ allowedRoles: ['usuario'] })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Cotas de Atendimento</h1>
        <p className="page-subtitle">
          Defina a quantidade de atendimentos que cada aluno pode agendar por mês, por curso.
        </p>
      </div>

      <CotasTable />
    </div>
  )
}
