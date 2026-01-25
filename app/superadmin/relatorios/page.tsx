import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Relatórios Globais | Super Admin'
}

export default function SuperAdminRelatoriosPage() {
    return (
        <div className="flex flex-col gap-8 h-full p-8">
            <header className="flex flex-col gap-2">
                <h1 className="page-title">Relatórios Globais</h1>
                <p className="page-subtitle">
                    Análises e relatórios consolidados de toda a plataforma
                </p>
            </header>

            <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">
                    🚧 Interface em construção - Implementação futura
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Funcionalidades planejadas: métricas de uso, receita, engajamento, relatórios customizados
                </p>
            </div>
        </div>
    )
}
