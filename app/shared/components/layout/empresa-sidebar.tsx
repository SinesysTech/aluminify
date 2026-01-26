"use client"

import {
  Users,
  LayoutDashboard,
  FileText,
  BookOpen,
  Calendar,
  CalendarCheck,
  Layers,
  FolderOpen,
  DollarSign,
  Shield,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

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
    url: "/empresa/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Alunos",
    url: "/usuario/alunos",
    icon: Users,
  },
  {
    title: "Equipe",
    url: "/usuario/equipe",
    icon: Users,
  },
  {
    title: "Papéis",
    url: "/empresa/detalhes/papeis",
    icon: Shield,
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
    ],
  },
  // Funcionalidades do Professor (Superset)
  {
    title: "Cursos",
    url: "/curso/admin",
    icon: BookOpen,
  },
  {
    title: "Disciplinas",
    url: "/disciplina",
    icon: FileText,
  },
  {
    title: "Segmentos",
    url: "/segmento",
    icon: Layers,
  },
  {
    title: "Conteúdo Programático",
    url: "/conteudos",
    icon: Calendar,
  },
  {
    title: "Materiais",
    url: "/professor/materiais",
    icon: FolderOpen,
  },
  {
    title: "Flashcards",
    url: "/flashcards",
    icon: FolderOpen,
  },
  {
    title: "Disponibilidade",
    url: "/agendamentos/disponibilidade",
    icon: CalendarCheck,
  },
  {
    title: "Agendamentos",
    url: "/agendamentos",
    icon: Calendar,
  },
]

export function EmpresaSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const navMainWithActive = empresaNavItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url + "/"),
  }))

  // Get organization name and first letter for fallback
  const organizationName = user.empresaNome || 'Organização'
  const fallbackLetter = organizationName.charAt(0).toUpperCase()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={getDefaultRouteForRole(user.role)}>
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



