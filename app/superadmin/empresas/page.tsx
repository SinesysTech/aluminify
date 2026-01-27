import React from "react"
import type { Metadata } from "next"
import { EmpresasContent } from "./components/empresas-content"

export const metadata: Metadata = {
  title: "Empresas | Super Admin",
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

      <EmpresasContent />
    </div>
  )
}
