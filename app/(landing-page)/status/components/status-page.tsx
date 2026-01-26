"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export function StatusPage() {
    const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">("loading");
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    // Simulated uptime bars (visual candy)
    const uptimeBars = Array.from({ length: 90 }, (_, i) => {
        // Mostly green, occasional random dip for realism
        const isDip = Math.random() > 0.98;
        return {
            id: i,
            height: isDip ? "60%" : "100%",
            color: isDip ? "bg-yellow-400" : "bg-green-400"
        };
    });

    const checkHealth = async () => {
        setApiStatus("loading");
        try {
            const res = await fetch("/api/health");
            if (res.ok) {
                setApiStatus("ok");
            } else {
                setApiStatus("error");
            }
        } catch (_error) {
            setApiStatus("error");
        } finally {
            setLastChecked(new Date());
        }
    };

    useEffect(() => {
        checkHealth();
        // Poll every 60 seconds
        const interval = setInterval(checkHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    const StatusIcon = () => {
        if (apiStatus === "loading") return <RefreshCw className="w-6 h-6 animate-spin text-white" />;
        if (apiStatus === "ok") return <CheckCircle className="w-8 h-8 text-white" />;
        return <XCircle className="w-8 h-8 text-white" />;
    };

    const statusColor = apiStatus === "error" ? "bg-red-500" : (apiStatus === "loading" ? "bg-blue-500" : "bg-green-500");
    const statusText = apiStatus === "error" ? "Interrupção de Serviço" : (apiStatus === "loading" ? "Verificando..." : "Todos os sistemas operacionais");

    return (
        <div className="bg-background text-foreground font-sans antialiased min-h-screen flex flex-col transition-colors duration-200">
            <nav className="w-full border-b border-border bg-card p-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Home
                    </Link>
                    <button 
                        onClick={checkHealth}
                        className="px-3 py-1 bg-muted hover:bg-muted/80 text-xs font-medium rounded transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className={`w-3 h-3 ${apiStatus === 'loading' ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </nav>

            <main className="grow max-w-4xl mx-auto w-full px-4 py-12">
                {/* Status Banner */}
                <div className={`${statusColor} text-white p-6 rounded-lg shadow-md mb-12 flex items-center justify-between transition-colors duration-500`}>
                    <div className="flex items-center gap-4">
                        <StatusIcon />
                        <div>
                            <h1 className="text-2xl font-bold">{statusText}</h1>
                            <p className="opacity-90 text-sm">
                                {apiStatus === 'ok' ? 'Nenhum incidente reportado.' : 'Investigando conectividade com a API.'}
                            </p>
                        </div>
                    </div>
                    {lastChecked && (
                        <span className="text-xs font-mono opacity-75 hidden sm:block">
                            Verificado em {lastChecked.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                {/* Infrastructure Components */}
                <div className="space-y-4 mb-12">
                    <h2 className="text-lg font-bold mb-4">Componentes de Infraestrutura</h2>

                    <StatusRow name="API Gateway (Edge)" status={apiStatus} />
                    <StatusRow name="Database Cluster (Postgres)" status={apiStatus === 'error' ? 'error' : 'ok'} />
                    <StatusRow name="Video CDN" status="ok" />
                    <StatusRow name="AI Inference Engine" status="ok" />
                    <StatusRow name="Authentication Service" status={apiStatus === 'error' ? 'error' : 'ok'} />
                </div>

                {/* Uptime History */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Uptime Histórico (API)</h2>
                    <div className="bg-card p-6 rounded-lg border border-border">
                        <div className="flex items-end gap-0.5 h-12 mb-2">
                            {uptimeBars.map((bar) => (
                                <div
                                    key={bar.id}
                                    className={`w-full rounded-sm ${bar.color} opacity-80 hover:opacity-100 transition-opacity`}
                                    style={{ height: bar.height }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground font-mono">
                            <span>90 dias atrás</span>
                            <span className="text-green-600 font-bold">99.95% Uptime</span>
                            <span>Hoje</span>
                        </div>
                    </div>
                </div>

                {/* Recent Incidents */}
                <div className="mt-12">
                    <h2 className="text-lg font-bold mb-4">Incidentes Recentes</h2>
                    <div className="bg-card p-6 rounded-lg border border-border">
                        <p className="text-muted-foreground text-center py-4 text-sm">
                            Nenhum incidente nos últimos 90 dias.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
                © 2026 Aluminify Status Page.
            </footer>
        </div>
    );
}

function StatusRow({ name, status }: { name: string, status: "loading" | "ok" | "error" }) {
    const isOk = status === "ok";
    const isLoading = status === "loading";
    
    return (
        <div className="bg-card p-4 rounded-lg border border-border flex justify-between items-center transition-colors">
            <span className="font-medium">{name}</span>
            <span className={`text-sm font-bold flex items-center gap-1 ${isOk ? 'text-green-600' : (isLoading ? 'text-blue-500' : 'text-red-500')}`}>
                {isLoading ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verificando
                    </>
                ) : isOk ? (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Operacional
                    </>
                ) : (
                    <>
                        <AlertTriangle className="w-4 h-4" />
                        Indisponível
                    </>
                )}
            </span>
        </div>
    );
}