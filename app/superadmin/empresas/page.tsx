import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Empresas | Super Admin'
}

export default function SuperAdminEmpresasPage() {
    return (
        <div className="flex flex-col gap-8 h-full p-8">
            <header className="flex flex-col gap-2">
                <h1 className="page-title">Gestão de Empresas</h1>
                <p className="page-subtitle">
                    Visualize e gerencie todas as empresas cadastradas no SaaS
                </p>
            </header>

            <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">
                    🚧 Interface em construção - Implementação futura
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Funcionalidades planejadas: listagem, edição, ativação/desativação, métricas por empresa
                </p>
            </div>
        </div>
    )
}
