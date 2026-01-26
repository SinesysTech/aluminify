import React from "react"
import type { Metadata } from "next"
import { AlunosContent } from "./components/alunos-content"

export const metadata: Metadata = {
  title: "Alunos | Super Admin",
}

export default function SuperAdminAlunosPage() {
  return (
    <div className="flex flex-col gap-8 h-full p-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">Gestão de Alunos</h1>
        <p className="page-subtitle">
          Visualize todos os alunos de todas as empresas
        </p>
      </header>

      <AlunosContent />
    </div>
  )
}
