import React from "react"
import type { Metadata } from "next"
import { DashboardContent } from "./components/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard | Super Admin",
}

export default function SuperAdminDashboard() {
  return (
    <div className="flex flex-col gap-8 h-full p-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-title">Dashboard Global</h1>
        <p className="page-subtitle">
          Visão geral de todas as empresas e métricas do SaaS
        </p>
      </header>

      <DashboardContent />
    </div>
  )
}
