import React from "react"
import type { Metadata } from "next"
import { RelatoriosContent } from "./components/relatorios-content"

export const metadata: Metadata = {
  title: "Relatórios Globais | Super Admin",
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

      <RelatoriosContent />
    </div>
  )
}
