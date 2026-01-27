import React from "react"
import type { Metadata } from "next"
import { LogsContent } from "./components/logs-content"

export const metadata: Metadata = {
  title: "Logs de Auditoria | Super Admin",
}

export default function SuperAdminLogsPage() {
  return (
    <div className="flex flex-col gap-8 h-full p-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">Logs de Auditoria</h1>
        <p className="page-subtitle">
          Monitore todas as atividades e eventos do sistema
        </p>
      </header>

      <LogsContent />
    </div>
  )
}
