"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/professor": "Professores",
  "/aluno": "Alunos",
  "/curso": "Cursos",
  "/disciplina": "Disciplinas",
  "/segmento": "Segmentos",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Remove leading slash and split path
  const segments = pathname.split("/").filter(Boolean)
  
  // Check if we're on a dashboard page (ends with /dashboard)
  const isDashboardPage = pathname === "/dashboard" || pathname.endsWith("/dashboard")
  
  // If we're at root or dashboard, show just Dashboard
  if (segments.length === 0 || isDashboardPage) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    const label = routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === segments.length - 1
    
    return { path, label, isLast }
  })

  // Filter out dashboard from breadcrumb items if it appears
  const filteredItems = breadcrumbItems.filter(item => item.label !== "Dashboard")

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {filteredItems.length > 0 ? (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{filteredItems[filteredItems.length - 1].label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

