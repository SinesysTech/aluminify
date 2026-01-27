import React from "react"
import type { Metadata } from "next"
import { PlanosContent } from "./components/planos-content"

export const metadata: Metadata = {
  title: "Planos e Assinaturas | Super Admin",
}

export default function SuperAdminPlanosPage() {
  return (
    <div className="flex flex-col gap-8 h-full p-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">Planos e Assinaturas</h1>
        <p className="page-subtitle">
          Gerencie os planos disponíveis e visualize a distribuição de empresas
        </p>
      </header>

      <PlanosContent />
    </div>
  )
}
