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
  "agente": "Agente",

  // Usuários
  "usuario": "Usuários",
  "alunos": "Alunos",
  "professores": "Professores",
  "equipe": "Equipe",
  "admins": "Admins",

  // Cursos
  "curso": "Cursos",
  "disciplinas": "Disciplinas",
  "segmentos": "Segmentos",
  "conteudo": "Conteúdo",
  "conteudos": "Conteúdos",
  "materiais": "Materiais",
  "relatorios": "Relatórios",
  "admin": "Administração",

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
  "settings": "Configurações",
  "empresa": "Empresa",
  "personalizacao": "Personalização",
  "avancadas": "Avançadas",
  "usuarios": "Usuários",
  "papeis": "Papéis",
  "modulos": "Módulos",

  // Estudos
  "estudos": "Estudos",
  "sala-de-estudos": "Sala de Estudos",
  "foco": "Modo Foco",
  "cronograma": "Cronograma",
  "calendario": "Calendário",

  // Autenticação
  "auth": "Autenticação",
  "login": "Login",
  "sign-up": "Cadastro",
  "forgot-password": "Esqueci a Senha",
  "update-password": "Atualizar Senha",
  "primeiro-acesso": "Primeiro Acesso",

  // Empresas
  "empresas": "Empresas",
  "planos": "Planos",
  "logs": "Logs",

  // Landing Page
  "features": "Funcionalidades",
  "docs": "Documentação",
  "changelog": "Histórico",
  "roadmap": "Roadmap",
  "status": "Status",
  "opensource": "Open Source",
  "manifesto": "Manifesto",
  "pricing": "Preços",

  // Outros
  "tobias": "TobIAs", // TOBIAS-LEGACY: Remover quando TobIAs for deletado
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

  // Filter out tenant slug and UUID-like segments
  const meaningfulItems = filteredItems.filter(item => {
    const seg = item.path.split("/").pop() || ""
    if (seg === tenantSlug) return false
    // Filter UUID-like segments (common in dynamic routes)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}/.test(seg)) return false
    return true
  })

  const lastItem = meaningfulItems[meaningfulItems.length - 1]
  const parentItem = meaningfulItems.length >= 2 ? meaningfulItems[meaningfulItems.length - 2] : null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {meaningfulItems.length > 0 ? (
          <>
            {/* Desktop: show Dashboard link */}
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={tenantSlug ? `/${tenantSlug}/dashboard` : "/dashboard"}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            {/* Mobile + Desktop: show parent as link when deep navigation */}
            {parentItem && (
              <>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href={parentItem.path}>{parentItem.label}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
              </>
            )}
            {/* Current page */}
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-50">{lastItem.label}</BreadcrumbPage>
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

