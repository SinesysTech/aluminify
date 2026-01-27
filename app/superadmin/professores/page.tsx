import React from "react"
import type { Metadata } from "next"
import { ProfessoresContent } from "./components/professores-content"

export const metadata: Metadata = {
  title: "Professores | Super Admin",
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

      <ProfessoresContent />
    </div>
  )
}
