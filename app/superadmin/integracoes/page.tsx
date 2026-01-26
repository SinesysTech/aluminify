import React from "react"
import type { Metadata } from "next"
import { IntegracoesContent } from "./components/integracoes-content"

export const metadata: Metadata = {
  title: "Integrações | Super Admin",
}

export default function SuperAdminIntegracoesPage() {
  return (
    <div className="flex flex-col gap-8 h-full p-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">Integrações</h1>
        <p className="page-subtitle">
          Monitore as integrações e API keys de todas as empresas
        </p>
      </header>

      <IntegracoesContent />
    </div>
  )
}
