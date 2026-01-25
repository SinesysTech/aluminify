import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Professores | Super Admin'
}

export default function SuperAdminProfessoresPage() {
    return (
        <div className="flex flex-col gap-8 h-full p-8">
            <header className="flex flex-col gap-2">
                <h1 className="page-title">Gestão de Professores</h1>
                <p className="page-subtitle">
                    Visualize todos os professores de todas as empresas
                </p>
            </header>

            <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">
                    🚧 Interface em construção - Implementação futura
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Funcionalidades planejadas: listagem global, filtros por empresa, métricas
                </p>
            </div>
        </div>
    )
}
