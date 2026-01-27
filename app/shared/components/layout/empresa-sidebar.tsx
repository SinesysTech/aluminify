"use client"

import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FolderOpen,
  DollarSign,
  Building2,
  GraduationCap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname, useParams } from "next/navigation"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { useCurrentUser } from "@/components/providers/user-provider"
import { TenantLogo } from "@/components/ui/tenant-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getDefaultRouteForRole } from "@/app/shared/core/roles"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  items?: {
    title: string
    url: string
  }[]
}

const empresaNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Alunos",
    url: "/usuario/alunos",
    icon: GraduationCap,
  },
  {
    title: "Cursos",
    url: "/curso/admin",
    icon: BookOpen,
    items: [
      { title: "Todos os Cursos", url: "/curso/admin" },
      { title: "Disciplinas", url: "/curso/disciplinas" },
      { title: "Segmentos", url: "/curso/segmentos" },
      { title: "Conteúdo Programático", url: "/curso/conteudos" },
      { title: "Relatórios", url: "/curso/relatorios" },
    ],
  },
  {
    title: "Biblioteca",
    url: "/biblioteca",
    icon: FolderOpen,
    items: [
      { title: "Visão Geral", url: "/biblioteca" },
      { title: "Materiais", url: "/biblioteca/materiais" },
      { title: "Flashcards", url: "/flashcards" },
    ],
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    items: [
      { title: "Dashboard", url: "/financeiro" },
      { title: "Transações", url: "/financeiro/transacoes" },
      { title: "Produtos", url: "/financeiro/produtos" },
      { title: "Cupons", url: "/financeiro/cupons" },
      { title: "Integrações", url: "/financeiro/integracoes" },
    ],
  },
  {
    title: "Agendamentos",
    url: "/agendamentos",
    icon: Calendar,
    items: [
      { title: "Visão Geral", url: "/agendamentos" },
      { title: "Meus Agendamentos", url: "/agendamentos/meus" },
      { title: "Disponibilidade", url: "/agendamentos/disponibilidade" },
      { title: "Bloqueios", url: "/agendamentos/bloqueios" },
      { title: "Estatísticas", url: "/agendamentos/stats" },
      { title: "Configurações", url: "/agendamentos/configuracoes" },
    ],
  },
  {
    title: "Empresa",
    url: "/empresa/detalhes",
    icon: Building2,
    items: [
      { title: "Detalhes", url: "/empresa/detalhes" },
      { title: "Usuários", url: "/usuario/equipe" },
      { title: "Papéis e Permissões", url: "/empresa/detalhes/papeis" },
      { title: "Personalização", url: "/empresa/personalizacao" },
      { title: "Módulos do Aluno", url: "/empresa/modulos" },
      { title: "Integrações", url: "/empresa/integracoes" },
      { title: "Configurações", url: "/empresa/configuracoes" },
    ],
  },
]

export function EmpresaSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()
  const params = useParams()
  const tenantSlug = params?.tenant as string

  // Dynamic nav items based on tenant
  const navItems = empresaNavItems.map(item => ({
    ...item,
    url: tenantSlug ? `/${tenantSlug}${item.url}` : item.url,
    items: item.items?.map(subItem => ({
      ...subItem,
      url: tenantSlug ? `/${tenantSlug}${subItem.url}` : subItem.url,
    })),
  }))

  const navMainWithActive = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  const homeLink = tenantSlug
    ? `/${tenantSlug}${getDefaultRouteForRole(user.role)}`
    : getDefaultRouteForRole(user.role)

  // Get organization name and first letter for fallback
  const organizationName = user.empresaNome || 'Organização'
  const fallbackLetter = organizationName.charAt(0).toUpperCase()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={homeLink}>
                <div className="flex items-center gap-3">
                  <TenantLogo
                    logoType="sidebar"
                    empresaId={user.empresaId}
                    width={32}
                    height={32}
                    fallbackText={fallbackLetter}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{organizationName}</span>
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} label="Menu" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}



