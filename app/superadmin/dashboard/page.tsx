import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Dashboard | Super Admin'
}

export default function SuperAdminDashboard() {
    return (
        <div className="flex flex-col gap-8 h-full p-8">
            <header className="flex flex-col gap-2">
                <h1 className="page-title">Dashboard Global</h1>
                <p className="page-subtitle">
                    Visão geral de todas as empresas e métricas do SaaS
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder para cards de métricas */}
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total de Empresas</div>
                    <div className="text-3xl font-bold mt-2">-</div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total de Professores</div>
                    <div className="text-3xl font-bold mt-2">-</div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total de Alunos</div>
                    <div className="text-3xl font-bold mt-2">-</div>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">Empresas Ativas</div>
                    <div className="text-3xl font-bold mt-2">-</div>
                </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">
                    🚧 Interface em construção - Implementação futura
                </p>
            </div>
        </div>
    )
}
