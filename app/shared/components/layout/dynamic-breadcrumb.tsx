"use client"

import { usePathname, useParams } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  // Dashboard
  "dashboard": "Dashboard",

  // Usuários
  "usuario": "Usuários",
  "alunos": "Alunos",
  "professores": "Professores",
  "equipe": "Equipe",
  "admins": "Administradores",

  // Cursos
  "curso": "Cursos",
  "disciplinas": "Disciplinas",
  "segmentos": "Segmentos",
  "conteudo": "Conteúdo",
  "materiais": "Materiais",
  "relatorios": "Relatórios",

  // Biblioteca
  "biblioteca": "Biblioteca",
  "flashcards": "Flashcards",

  // Financeiro
  "financeiro": "Financeiro",
  "transacoes": "Transações",
  "produtos": "Produtos",
  "cupons": "Cupons",
  "integracoes": "Integrações",

  // Agendamentos
  "agendamentos": "Agendamentos",
  "disponibilidade": "Disponibilidade",
  "bloqueios": "Bloqueios",
  "stats": "Estatísticas",
  "meus": "Meus Agendamentos",
  "detalhes": "Detalhes",
  "configuracoes": "Configurações",

  // Empresa
  "empresa": "Empresa",
  "personalizacao": "Personalização",
  "avancadas": "Avançadas",
  "usuarios": "Usuários",
  "papeis": "Papéis",

  // Estudos
  "estudos": "Estudos",
  "sala-de-estudos": "Sala de Estudos",
  "foco": "Modo Foco",
  "cronograma": "Cronograma",
  "calendario": "Calendário",

  // Outros
  "tobias": "TobIAs",
  "perfil": "Perfil",
  "nova": "Nova",
  "novo": "Novo",
  "editar": "Editar",
  "completar": "Completar",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params?.tenant as string | undefined
  
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
    // Busca pelo segmento individual (ex: "financeiro", "transacoes")
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
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
              <BreadcrumbLink href={tenantSlug ? `/${tenantSlug}/dashboard` : "/dashboard"}>Dashboard</BreadcrumbLink>
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

