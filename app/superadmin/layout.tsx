import React from "react"
import { SidebarProvider } from "@/app/shared/components/ui/sidebar"
import { SuperAdminSidebar } from "./components/superadmin-sidebar"
import { requireSuperAdminRoute } from "@/app/shared/core/route-guards"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protege todas as rotas do superadmin
  // Redireciona para a rota padrão do role se não for superadmin
  await requireSuperAdminRoute()

  return (
    <SidebarProvider>
      <SuperAdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </SidebarProvider>
  )
}
