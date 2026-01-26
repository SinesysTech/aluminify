"use client";

import Link from "next/link";

export function StatusPage() {
    // Generate uptime bars
    const uptimeBars = Array.from({ length: 90 }, (_, i) => {
        const isDown = Math.random() > 0.98;
        return {
            id: i,
            height: isDown ? "60%" : "100%",
            color: isDown ? "bg-yellow-400" : "bg-green-400"
        };
    });

    return (
        <div className="bg-background text-foreground font-sans antialiased min-h-screen flex flex-col">
            <nav className="w-full border-b border-zinc-200 dark:border-zinc-700 bg-card p-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                        <span className="material-icons-outlined">arrow_back</span>
                        Voltar para Home
                    </Link>
                    <a href="#" className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition">
                        Inscrever-se para atualizações
                    </a>
                </div>
            </nav>

            <main className="grow max-w-4xl mx-auto w-full px-4 py-12">
                {/* Status Banner */}
                <div className="bg-green-500 text-white p-6 rounded-lg shadow-md mb-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="material-icons-outlined text-4xl">check_circle</span>
                        <div>
                            <h1 className="text-2xl font-bold">Todos os sistemas operacionais</h1>
                            <p className="opacity-90">Nenhum incidente reportado nos últimos 90 dias.</p>
                        </div>
                    </div>
                    <span className="text-sm font-mono opacity-75">Atualizado há 1 min</span>
                </div>

                {/* Infrastructure Components */}
                <div className="space-y-4 mb-12">
                    <h2 className="text-lg font-bold mb-4">Componentes de Infraestrutura</h2>

                    <div className="bg-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">API Gateway (South America)</span>
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">check</span>
                            Operacional
                        </span>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Database Cluster (Postgres)</span>
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">check</span>
                            Operacional
                        </span>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Video CDN</span>
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">check</span>
                            Operacional
                        </span>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">AI Inference Engine (RAG)</span>
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">check</span>
                            Operacional
                        </span>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Authentication Service</span>
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">check</span>
                            Operacional
                        </span>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="font-medium text-zinc-700 dark:text-zinc-200">Email Delivery</span>
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">check</span>
                            Operacional
                        </span>
                    </div>
                </div>

                {/* Uptime History */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Uptime Histórico</h2>
                    <div className="bg-card p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-end gap-0.5 h-12 mb-2">
                            {uptimeBars.map((bar) => (
                                <div
                                    key={bar.id}
                                    className={`w-full rounded-sm ${bar.color} opacity-80 hover:opacity-100 transition-opacity`}
                                    style={{ height: bar.height }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400 font-mono">
                            <span>90 dias atrás</span>
                            <span className="text-green-600 font-bold">99.99% Uptime</span>
                            <span>Hoje</span>
                        </div>
                    </div>
                </div>

                {/* Recent Incidents */}
                <div className="mt-12">
                    <h2 className="text-lg font-bold mb-4">Incidentes Recentes</h2>
                    <div className="bg-card p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">
                            Nenhum incidente nos últimos 90 dias.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-zinc-400 border-t border-zinc-200 dark:border-zinc-700">
                © 2026 Aluminify Status Page.
            </footer>
        </div>
    );
}
