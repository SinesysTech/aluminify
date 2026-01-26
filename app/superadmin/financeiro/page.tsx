import React from "react"
import type { Metadata } from "next"
import { FinanceiroContent } from "./components/financeiro-content"

export const metadata: Metadata = {
  title: "Financeiro Global | Super Admin",
}

export default function SuperAdminFinanceiroPage() {
  return (
    <div className="flex flex-col gap-8 h-full p-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">Financeiro Global</h1>
        <p className="page-subtitle">
          Visão consolidada de receitas e transações de todas as empresas
        </p>
      </header>

      <FinanceiroContent />
    </div>
  )
}
